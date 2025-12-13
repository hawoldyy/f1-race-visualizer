import kagglehub
import shutil
import os

path = kagglehub.dataset_download("rohanrao/formula-1-world-championship-1950-2020")

print("Downloaded dataset path:", path)

DEST = "backend/data"

os.makedirs(DEST, exist_ok=True)

for file in os.listdir(path):
    if file.endswith(".csv"):
        src = os.path.join(path, file)
        dst = os.path.join(DEST, file)
        shutil.copy(src, dst)
        print(f"Copied: {file}")
