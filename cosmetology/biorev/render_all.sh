#!/usr/bin/env bash
# Renders every Cycles plate and the injection animation used by comp.py (several hours on 4 CPU cores)
cd "$(dirname "$0")"
P=cache/plates
r() { [ -s "$P/$1.png" ] || python3 scene.py "${@:2}" "$P/$1.png" --res 1.0 --samples 96 2>&1 | grep -E "rendered|Error"; echo "$1 done"; }
r section_bad section --state bad
r dermis_bad dermis --state bad --bolus 1
r dermis_good dermis --state good --bolus 0.85
r section_good section --state good --bolus 0.45 --papule 0.15
r surface_bad surface --state bad
r surface_good surface --state good
r syringe syringe --syringe 0
python3 scene.py anim_inject cache/anim 0-56 0.75 24 2>&1 | grep -E "^frame|Error"
echo ALLDONE
