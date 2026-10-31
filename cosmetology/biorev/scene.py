"""Blender (bpy module) scene: skin block with a cut face, hair follicle, fat lobules, gel bolus and syringe.

    python3 scene.py <shot> <out.png> [--state bad|good] [--bolus 0..1] [--syringe 0..1] [--res 1.0] [--samples N]
    python3 scene.py anim_inject <outdir> --frames 0-119

Shots: surface, syringe, section, inject, dermis, result.
"""
import os, sys, math, json, argparse, time
import numpy as np
import bpy
import addon_utils
from mathutils import Vector, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(HERE, "cache", "tex")
META = json.load(open(os.path.join(TEX, "meta.json")))
BW, BD = 3.0, 2.4                 # cut face width / depth
BL = 3.0                          # block length along Y (front face at y = -BL/2)
YF = -BL / 2
BOLUS = Vector((-0.08, YF + 0.02, -0.50))
ENTRY = Vector((0.55, YF + 0.03, 0.0))


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    addon_utils.enable("cycles")


def img(path, non_color=False):
    im = bpy.data.images.load(path, check_existing=True)
    if non_color:
        im.colorspace_settings.name = "Non-Color"
    return im


def principled(mat):
    nt = mat.node_tree
    for n in nt.nodes:
        if n.type == "BSDF_PRINCIPLED":
            return nt, n
    raise RuntimeError("no principled")


def setv(node, name, val):
    if name in node.inputs:
        node.inputs[name].default_value = val


def add_papule_key(ob, fn_basis_xyz):
    """Shape key 'papule' that pushes the vertices away from the bolus."""
    ob.shape_key_add(name="Basis")
    k = ob.shape_key_add(name="papule")
    co = np.zeros(len(ob.data.vertices) * 3, np.float32)
    ob.data.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3)
    x, y, z = bulge(co[:, 0], co[:, 1], co[:, 2], 1.0)
    k.data.foreach_set("co", np.stack([x, y, z], 1).astype(np.float32).ravel())
    return k


def grid_mesh(name, nx, ny, fn):
    """fn(u, v) -> (x, y, z) arrays over u, v in [0, 1]; returns object with UVs (u, 1 - v)."""
    u, v = np.meshgrid(np.linspace(0, 1, nx), np.linspace(0, 1, ny))
    x, y, z = fn(u, v)
    verts = np.stack([x, y, z], -1).reshape(-1, 3)
    idx = np.arange(nx * ny).reshape(ny, nx)
    a, b, c, d = idx[:-1, :-1], idx[:-1, 1:], idx[1:, 1:], idx[1:, :-1]
    faces = np.stack([a, b, c, d], -1).reshape(-1, 4)
    me = bpy.data.meshes.new(name)
    me.vertices.add(len(verts))
    me.vertices.foreach_set("co", verts.astype(np.float32).ravel())
    me.loops.add(len(faces) * 4)
    me.loops.foreach_set("vertex_index", faces.astype(np.int32).ravel())
    me.polygons.add(len(faces))
    me.polygons.foreach_set("loop_start", np.arange(0, len(faces) * 4, 4, dtype=np.int32))
    me.polygons.foreach_set("loop_total", np.full(len(faces), 4, np.int32))
    uvl = me.uv_layers.new(name="UVMap")
    uvs = np.stack([u.ravel(), 1 - v.ravel()], -1)[faces.ravel()]
    uvl.data.foreach_set("uv", uvs.astype(np.float32).ravel())
    me.update(calc_edges=True)
    me.validate()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def load_height(name, w, h):
    import cv2
    a = cv2.imread(os.path.join(TEX, name + "_h.png"), cv2.IMREAD_UNCHANGED).astype(np.float32) / 65535
    return cv2.resize(cv2.GaussianBlur(a, (0, 0), 1.2), (w, h), interpolation=cv2.INTER_AREA)


def bulge(x, y, z, amt):
    """Push geometry away from the bolus centre (papule), strongest near it."""
    if amt <= 0:
        return x, y, z
    dx, dy, dz = x - BOLUS.x, y - BOLUS.y, z - BOLUS.z
    r = np.sqrt((dx / 1.25) ** 2 + (dy / 1.0) ** 2 + (dz / 0.75) ** 2) + 1e-6
    k = amt * 0.11 * np.exp(-(r / 0.55) ** 2)
    return x + dx / r * k * 0.6, y + dy / r * k * 0.3, z + dz / r * k * 1.25


def skin_material(name, kind, state, bump=0.35):
    mat = bpy.data.materials.new(name)
    nt, bsdf = principled(mat)
    alb = nt.nodes.new("ShaderNodeTexImage"); alb.image = img(os.path.join(TEX, f"{kind}_{state}_alb.png"))
    rgh = nt.nodes.new("ShaderNodeTexImage"); rgh.image = img(os.path.join(TEX, f"{kind}_{state}_r.png"), True)
    hgt = nt.nodes.new("ShaderNodeTexImage"); hgt.image = img(os.path.join(TEX, f"{kind}_{state}_h.png"), True)
    for t in (alb, rgh, hgt):
        t.interpolation = "Cubic"
    nt.links.new(alb.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(rgh.outputs["Color"], bsdf.inputs["Roughness"])
    bn = nt.nodes.new("ShaderNodeBump")
    bn.inputs["Strength"].default_value = bump
    bn.inputs["Distance"].default_value = 0.004
    nt.links.new(hgt.outputs["Color"], bn.inputs["Height"])
    nt.links.new(bn.outputs["Normal"], bsdf.inputs["Normal"])
    setv(bsdf, "Subsurface Weight", 0.35 if kind == "cut" else 0.5)
    setv(bsdf, "Subsurface Radius", (0.9, 0.35, 0.2))
    setv(bsdf, "Subsurface Scale", 0.035)
    setv(bsdf, "Coat Weight", 0.35 if (kind == "cut" or state == "good") else 0.05)
    setv(bsdf, "Coat Roughness", 0.18)
    setv(bsdf, "Specular IOR Level", 0.5)
    return mat


def build_block(state, papule=0.0):
    # cut face (front)
    nx, nz = 1100, 880
    hc = load_height("cut_" + state, nx, nz)
    amp = 0.034

    def front(u, v):
        x = (u - 0.5) * BW
        z = -v * BD
        y = YF - (hc - 0.5) * amp
        return x, y, z
    cut = grid_mesh("Cut", nx, nz, front)
    cut.data.materials.append(skin_material("CutMat", "cut", state))
    # top surface
    n = 900
    ht = load_height("top_" + state, n, n)

    def top(u, v):
        x = (u - 0.5) * BW
        y = YF - 0.004 + v * BL
        z = (ht - 0.5) * 0.03 + 0.001
        return x, y, z
    tp = grid_mesh("Top", n, n, top)
    tp.data.materials.append(skin_material("TopMat", "top", state, bump=0.5))
    # rounded lip between top and cut so the corner catches a highlight
    def lip(u, v):
        x = (u - 0.5) * BW
        a = v * math.pi / 2
        r = 0.012
        y = YF + r - r * np.sin(a) - 0.002
        z = -r + r * np.cos(a)
        return x, y, z
    lp = grid_mesh("Lip", 400, 6, lip)
    lp.data.materials.append(bpy.data.materials["CutMat"])
    for ob in (cut, tp, lp):
        k = add_papule_key(ob, None)
        k.value = papule
    # dark sides so the block reads as a slab if they show
    return cut, tp


def simple_mat(name, color, rough=0.4, sss=0.0, transmission=0.0, ior=1.45, emission=None, estr=0.0, coat=0.0,
               metallic=0.0, alpha=1.0):
    mat = bpy.data.materials.new(name)
    nt, b = principled(mat)
    setv(b, "Base Color", (*color, 1))
    setv(b, "Roughness", rough)
    setv(b, "Metallic", metallic)
    setv(b, "Subsurface Weight", sss)
    setv(b, "Subsurface Radius", (1.0, 0.5, 0.25))
    setv(b, "Subsurface Scale", 0.03)
    setv(b, "Transmission Weight", transmission)
    setv(b, "IOR", ior)
    setv(b, "Coat Weight", coat)
    setv(b, "Alpha", alpha)
    if emission:
        setv(b, "Emission Color", (*emission, 1))
        setv(b, "Emission Strength", estr)
    return mat


def curve_tube(name, pts, radius, mat, taper=None):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = radius
    cu.bevel_resolution = 6
    sp = cu.splines.new("BEZIER")
    sp.bezier_points.add(len(pts) - 1)
    for bp, p in zip(sp.bezier_points, pts):
        bp.co = p
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    ob = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(ob)
    ob.data.materials.append(mat)
    if taper:
        for bp, r in zip(sp.bezier_points, taper):
            bp.radius = r
    return ob


def sphere(name, loc, scale, mat, seg=48):
    me = bpy.data.meshes.new(name)
    import bmesh
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=1.0)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    ob.scale = scale
    ob.data.materials.append(mat)
    return ob


def build_hair():
    hair = simple_mat("Hair", (0.08, 0.04, 0.025), rough=0.28, coat=0.6)
    sheath = simple_mat("Sheath", (0.62, 0.30, 0.28), rough=0.35, sss=0.3, coat=0.4)
    gland = simple_mat("Gland", (0.98, 0.80, 0.42), rough=0.25, sss=0.6, coat=0.5)
    x0 = 0.95
    pts = [Vector((x0 + 0.55, YF - 0.25, 1.25)), Vector((x0 + 0.25, YF - 0.12, 0.55)), Vector((x0 + 0.03, YF + 0.01, 0.02)),
           Vector((x0 - 0.15, YF - 0.005, -0.6)), Vector((x0 - 0.32, YF - 0.005, -1.35))]
    curve_tube("HairShaft", pts, 0.032, hair)
    sp = [Vector((x0 + 0.02, YF + 0.06, -0.05)), Vector((x0 - 0.15, YF + 0.065, -0.6)), Vector((x0 - 0.33, YF + 0.07, -1.40))]
    curve_tube("Sheath", sp, 0.075, sheath)
    sphere("Bulb", (x0 - 0.34, YF + 0.05, -1.45), (0.10, 0.08, 0.12), sheath)
    rng = np.random.default_rng(3)
    for k in range(9):
        c = Vector((x0 - 0.08 + rng.uniform(0.06, 0.22), YF + 0.015, -0.45 - rng.uniform(0, 0.25)))
        r = rng.uniform(0.045, 0.075)
        sphere("Gland%d" % k, c, (r, r * 0.8, r), gland, 32)


def build_fat():
    fat = simple_mat("Fat", (0.95, 0.62, 0.16), rough=0.2, sss=0.5, coat=0.8)
    rng = np.random.default_rng(8)
    placed = []
    for _ in range(400):
        x = rng.uniform(-1.6, 1.6)
        z = rng.uniform(-2.45, -1.95)
        r = rng.uniform(0.035, 0.07)
        if any((x - a) ** 2 + (z - c) ** 2 < (r + rr) ** 2 * 0.85 for a, c, rr in placed):
            continue
        placed.append((x, z, r))
        sphere("Fat", (x, YF + r * 0.55, z), (r, r * 0.8, r), fat, 24)


def gel_material():
    mat = bpy.data.materials.new("Gel")
    nt, b = principled(mat)
    setv(b, "Base Color", (0.25, 0.58, 1.0, 1))
    setv(b, "Roughness", 0.04)
    setv(b, "Transmission Weight", 0.75)
    setv(b, "IOR", 1.34)
    setv(b, "Coat Weight", 1.0)
    setv(b, "Coat Roughness", 0.02)
    # inner glow: noise-shaped blue emission
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 6.0
    noise.inputs["Detail"].default_value = 6.0
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[0].color = (0.05, 0.25, 0.9, 1)
    ramp.color_ramp.elements[1].position = 0.75
    ramp.color_ramp.elements[1].color = (0.75, 0.95, 1.0, 1)
    nt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Emission Color"])
    setv(b, "Emission Strength", 0.9)
    return mat


def build_bolus(scale):
    if scale <= 0.01:
        return None
    s = scale
    ob = sphere("Bolus", BOLUS + Vector((0, -0.05, 0)), (0.34 * s, 0.24 * s, 0.17 * s), gel_material(), 64)
    ob.rotation_euler = (0, 0.12, 0)
    return ob


def syringe_dir():
    d = (ENTRY - BOLUS).normalized() + Vector((0.0, -0.35, 0.0))
    return d.normalized()


def syringe_tip(pose):
    return BOLUS + syringe_dir() * ((1.0 - pose) * 1.6 + 0.05)


def build_syringe(pose):
    """pose 0 = hovering above, 1 = needle tip at the bolus centre."""
    glass = simple_mat("Glass", (0.95, 0.97, 1.0), rough=0.03, transmission=1.0, ior=1.5)
    gelc = simple_mat("GelFill", (0.70, 0.88, 1.0), rough=0.02, transmission=0.95, ior=1.34,
                      emission=(0.25, 0.55, 1.0), estr=0.6)
    steel = simple_mat("Steel", (0.9, 0.9, 0.92), rough=0.12, metallic=1.0)
    hub = simple_mat("Hub", (0.35, 0.75, 0.95), rough=0.2, transmission=0.6, ior=1.45)
    rubber = simple_mat("Rubber", (0.03, 0.03, 0.035), rough=0.5)
    direction = syringe_dir()
    tip = syringe_tip(pose)
    root = bpy.data.objects.new("Syringe", None)
    bpy.context.scene.collection.objects.link(root)
    parts = []
    L_needle, L_hub, L_barrel = 1.05, 0.16, 1.8

    def cyl(name, r, z0, z1, mat, verts=64):
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=z1 - z0, location=(0, 0, (z0 + z1) / 2))
        ob = bpy.context.object
        ob.name = name
        ob.data.materials.append(mat)
        for p in ob.data.polygons:
            p.use_smooth = True
        ob.parent = root
        return ob
    cyl("Needle", 0.011, 0.02, L_needle, steel, 24)
    cone_me = bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=0.0, radius2=0.011, depth=0.05, location=(0, 0, 0.0))
    bpy.context.object.data.materials.append(steel)
    bpy.context.object.parent = root
    cyl("Hub", 0.05, L_needle, L_needle + L_hub, hub)
    cyl("Barrel", 0.125, L_needle + L_hub, L_needle + L_hub + L_barrel, glass)
    cyl("Fill", 0.112, L_needle + L_hub + 0.02, L_needle + L_hub + L_barrel * 0.62, gelc)
    cyl("Stopper", 0.113, L_needle + L_hub + L_barrel * 0.62, L_needle + L_hub + L_barrel * 0.62 + 0.08, rubber)
    cyl("Rod", 0.04, L_needle + L_hub + L_barrel * 0.62 + 0.08, L_needle + L_hub + L_barrel + 0.6, simple_mat(
        "Rod", (0.92, 0.94, 0.96), rough=0.3, transmission=0.5))
    cyl("Flange", 0.22, L_needle + L_hub + L_barrel - 0.03, L_needle + L_hub + L_barrel, glass)
    # graduation marks
    for k in range(9):
        zc = L_needle + L_hub + 0.15 + k * 0.16
        bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.1262, depth=0.008, location=(0, 0, zc))
        ob = bpy.context.object
        ob.data.materials.append(simple_mat("Mark%d" % k, (0.15, 0.15, 0.2), rough=0.5))
        ob.parent = root
        ob.scale = (1, 1, 1)
    drop = sphere("TipDrop", (0, 0, -0.012), (0.026, 0.026, 0.032), gel_material(), 32)
    drop.parent = root
    root.location = tip
    root.rotation_mode = "QUATERNION"
    root.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(direction)
    return root


def build_lights(kind="section"):
    w = bpy.data.worlds.new("W")
    bpy.context.scene.world = w
    nt = w.node_tree
    bg = [n for n in nt.nodes if n.type == "BACKGROUND"][0]
    grad = nt.nodes.new("ShaderNodeTexGradient")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Rotation"].default_value = (0, -math.pi / 2, 0)
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.010, 0.007, 0.006, 1)
    ramp.color_ramp.elements[1].color = (0.11, 0.075, 0.06, 1)
    nt.links.new(tc.outputs["Generated"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], grad.inputs["Vector"])
    nt.links.new(grad.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 1.0

    def area(name, loc, target, energy, size, color):
        li = bpy.data.lights.new(name, "AREA")
        li.energy = energy
        li.size = size
        li.shape = "DISK"
        li.color = color
        ob = bpy.data.objects.new(name, li)
        bpy.context.scene.collection.objects.link(ob)
        ob.location = loc
        d = Vector(target) - Vector(loc)
        ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
        return ob
    area("Key", (-3.5, -5.0, 4.5), (0, -1.2, -0.6), 650, 2.2, (1.0, 0.86, 0.72))
    area("Rim", (3.0, 3.0, 2.2), (0, -1, -0.3), 450, 1.5, (0.75, 0.85, 1.0))
    area("Fill", (4.0, -5.5, 0.5), (0, -1.5, -0.8), 110, 4.0, (1.0, 0.9, 0.85))
    area("Top", (0.0, 0.0, 6.0), (0, 0, 0), 160, 6.0, (1.0, 0.95, 0.9))


def camera(loc, target, lens=50, focus=None, fstop=2.8, roll=0.0):
    cam = bpy.data.cameras.new("Cam")
    cam.lens = lens
    cam.sensor_fit = "VERTICAL"
    cam.sensor_height = 24
    cam.clip_start = 0.01
    if focus is not None:
        cam.dof.use_dof = True
        cam.dof.aperture_fstop = fstop
        cam.dof.focus_distance = focus
    ob = bpy.data.objects.new("Cam", cam)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    d = Vector(target) - Vector(loc)
    q = d.to_track_quat("-Z", "Y")
    ob.rotation_euler = q.to_euler()
    ob.rotation_euler.rotate_axis("Z", roll)
    bpy.context.scene.camera = ob
    return ob


SHOTS = {
    # loc, target, lens, fstop
    "surface": ((0.2, -0.75, 0.16), (0.0, 0.5, 0.0), 45, 2.0),
    "syringe": ((1.9, YF - 2.0, 1.25), (0.62, YF + 0.0, 0.62), 85, 2.2),
    "section": ((0.9, YF - 5.6, 1.6), (0.1, YF + 0.3, -0.95), 50, 5.6),
    "inject": ((0.75, YF - 4.4, 0.9), (0.05, YF + 0.2, -0.55), 50, 4.0),
    "dermis": ((0.05, YF - 2.0, -0.35), (-0.08, YF, -0.6), 50, 3.2),
}


def setup_render(res, samples, shot):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = samples
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.adaptive_threshold = 0.02
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 8
    sc.cycles.transmission_bounces = 8
    sc.cycles.glossy_bounces = 4
    sc.cycles.diffuse_bounces = 3
    sc.cycles.caustics_reflective = False
    sc.cycles.caustics_refractive = False
    sc.render.resolution_x = int(1080 * res)
    sc.render.resolution_y = int(1920 * res)
    sc.render.film_transparent = False
    try:
        sc.view_settings.view_transform = "AgX"
        sc.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass
    sc.view_settings.exposure = 0.0
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_depth = "16"


def build(state="bad", bolus=0.0, syringe=None, papule=None, shot="section"):
    reset()
    papule = bolus if papule is None else papule
    if shot != "syringe":
        build_block(state, papule)
        build_hair()
        build_fat()
        build_bolus(max(bolus, 0.011) if shot == "inject" else bolus)
    if syringe is not None:
        build_syringe(syringe)
    build_lights()
    loc, tgt, lens, fs = SHOTS[shot]
    focus = (Vector(tgt) - Vector(loc)).length
    if shot == "dermis":
        focus = (BOLUS - Vector(loc)).length
    if shot == "syringe":
        tip = syringe_tip(syringe or 0.0)
        tgt = tip + syringe_dir() * 0.95
        loc = tgt + Vector((2.7, -4.1, -0.9))
        focus = (Vector(tgt) - Vector(loc)).length
        camera(loc, tgt, lens, focus, fs, roll=0.0)
        return
    if shot == "surface":
        focus = 0.75
    camera(loc, tgt, lens, focus, fs)


def ease(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def anim_inject(outdir, f0, f1, res, samples, n=60):
    """Needle goes in over frames 0-18, gel bolus and papule grow over 20-56."""
    build("bad", 1.0, 0.0, 0.0, "inject")
    setup_render(res, samples, "inject")
    sc = bpy.context.scene
    sc.render.use_persistent_data = True
    bol = bpy.data.objects["Bolus"]
    base_scale = bol.scale.copy()
    root = bpy.data.objects["Syringe"]
    keys = [bpy.data.objects[nm].data.shape_keys.key_blocks["papule"] for nm in ("Cut", "Top", "Lip")]
    drop = bpy.data.objects["TipDrop"]
    os.makedirs(outdir, exist_ok=True)
    for f in range(f0, f1 + 1):
        ins = ease(f / 18.0)
        grow = ease((f - 20) / 36.0)
        root.location = syringe_tip(0.02 + 0.98 * ins)
        drop.hide_render = ins > 0.3
        g = max(grow, 0.03)
        bol.scale = (base_scale.x * g / max(base_scale.x / 0.34, 1e-6) * 1 if False else 0.34 * g, 0.24 * g, 0.17 * g)
        bol.hide_render = grow <= 0.0
        for k in keys:
            k.value = grow
        sc.render.filepath = os.path.join(outdir, "f%03d.png" % f)
        t = time.time()
        bpy.ops.render.render(write_still=True)
        print("frame", f, "%.1fs" % (time.time() - t), flush=True)


def main():
    if sys.argv[1] == "anim_inject":
        f0, f1 = [int(v) for v in sys.argv[3].split("-")]
        anim_inject(sys.argv[2], f0, f1, float(sys.argv[4]), int(sys.argv[5]))
        return
    ap = argparse.ArgumentParser()
    ap.add_argument("shot")
    ap.add_argument("out")
    ap.add_argument("--state", default="bad")
    ap.add_argument("--bolus", type=float, default=0.0)
    ap.add_argument("--papule", type=float, default=None)
    ap.add_argument("--syringe", type=float, default=None)
    ap.add_argument("--res", type=float, default=1.0)
    ap.add_argument("--samples", type=int, default=96)
    a = ap.parse_args()
    t = time.time()
    build(a.state, a.bolus, a.syringe, a.papule, a.shot)
    setup_render(a.res, a.samples, a.shot)
    bpy.context.scene.render.filepath = a.out
    print("built %.1fs" % (time.time() - t), flush=True)
    bpy.ops.render.render(write_still=True)
    print("rendered %.1fs" % (time.time() - t), flush=True)


if __name__ == "__main__":
    main()
