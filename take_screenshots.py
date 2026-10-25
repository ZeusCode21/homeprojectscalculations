#!/usr/bin/env python3
import subprocess
import time
import os

# Close existing Chrome instances
subprocess.run(["pkill", "-f", "chrome"], stderr=subprocess.DEVNULL)
time.sleep(2)

# Screenshots to take with their corresponding sections
screenshots = [
    ("overview", "Top numbers"),
    ("lead-sources", "Lead sources"), 
    ("plans", "Plans and value"),
    ("month-grid", "Month by month"),
    ("scenarios", "Scenarios")
]

url = "http://localhost:3847"

# Use Chrome with remote debugging
chrome_cmd = [
    "google-chrome",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1440,900",
    "--force-device-scale-factor=1",
    f"--screenshot=/opt/cursor/artifacts/screenshots/temp.png",
    url
]

print("Taking full page screenshot with Chrome headless at 1440px width...")
result = subprocess.run(chrome_cmd, capture_output=True, text=True)

if result.returncode == 0:
    print("Screenshot captured successfully")
    # This captures the initial page, which shows the overview
    os.rename("/opt/cursor/artifacts/screenshots/temp.png", 
              "/opt/cursor/artifacts/screenshots/overview-new.png")
else:
    print(f"Error: {result.stderr}")

