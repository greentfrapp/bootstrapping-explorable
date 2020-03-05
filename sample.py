import numpy as np

a = np.random.randn(2, 20) * 15 + 25

print(a)

print(np.mean(a[0,:]) - np.mean(a[1,:]))