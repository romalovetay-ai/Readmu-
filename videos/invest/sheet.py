import sys, cv2, numpy as np, os
fs = sys.argv[2:]
ims = [cv2.imread(f) for f in fs]
ims = [cv2.putText(i, os.path.basename(f), (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,255), 2) for i, f in zip(ims, fs)]
cols = 2
rows = [np.hstack(ims[i:i+cols] + [np.zeros_like(ims[0])] * (cols - len(ims[i:i+cols]))) for i in range(0, len(ims), cols)]
cv2.imwrite(sys.argv[1], np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 85])
