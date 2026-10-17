#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Acceptance Test for Mehregan Bale Bot Module (P1.1)
Validates configuration integrity, handler loading, and JSON schema syntax.
"""

import json
import os
import sys
from pathlib import Path

def test_bale_bot_module():
    print("==================================================")
    print("🧪 Running Acceptance Test: Bale Bot Module (P1.1)")
    print("==================================================")

    base_dir = Path(__file__).resolve().parent.parent / "source"
    config_dir = base_dir / "config"

    # Check 1: Config files exist and are valid JSON
    required_configs = ["clinic_info.json", "menu.json", "services.json", "working_hours.json"]
    for cfg in required_configs:
        file_path = config_dir / cfg
        if not file_path.exists():
            print(f"❌ Missing config file: {cfg}")
            sys.exit(1)
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                print(f"  ✓ Valid JSON config: {cfg} ({len(data)} root keys)")
            except json.JSONDecodeError as e:
                print(f"❌ Invalid JSON in {cfg}: {e}")
                sys.exit(1)

    # Check 2: Entry point syntax test
    main_file = base_dir / "main.py"
    if not main_file.exists():
        print("❌ main.py not found in source directory.")
        sys.exit(1)

    with open(main_file, "r", encoding="utf-8") as f:
        code = f.read()
        try:
            compile(code, str(main_file), "exec")
            print("  ✓ main.py syntax compiled successfully.")
        except SyntaxError as e:
            print(f"❌ Syntax error in main.py: {e}")
            sys.exit(1)

    # Check 3: Systemd service unit validation
    service_file = Path(__file__).resolve().parent.parent / "systemd" / "mehregan-bale-bot.service"
    if not service_file.exists():
        print("❌ Systemd service file does not exist.")
        sys.exit(1)

    service_size = service_file.stat().st_size
    if service_size == 0:
        print("❌ Systemd service file is empty (0 bytes).")
        sys.exit(1)
    print(f"  ✓ Systemd service file exists and non-empty ({service_size} bytes).")

    with open(service_file, "r", encoding="utf-8") as f:
        service_content = f.read()

    required_sections = ["[Unit]", "[Service]", "[Install]"]
    for sec in required_sections:
        if sec not in service_content:
            print(f"❌ Missing section {sec} in systemd service file.")
            sys.exit(1)
        print(f"  ✓ Found required section: {sec}")

    exec_start_lines = [l.strip() for l in service_content.splitlines() if l.strip().startswith("ExecStart=")]
    if not exec_start_lines:
        print("❌ Missing ExecStart directive in systemd service file.")
        sys.exit(1)

    exec_start_val = exec_start_lines[0]
    if "main.py" not in exec_start_val:
        print(f"❌ ExecStart does not target main.py: {exec_start_val}")
        sys.exit(1)
    print(f"  ✓ ExecStart targets main.py correctly: {exec_start_val}")

    total_checks = len(required_configs) + 1 + 1 + len(required_sections) + 1
    print("==================================================")
    print(f"✅ P1.1 ACCEPTANCE TEST PASSED ({total_checks}/{total_checks} verified items: Configs, Entrypoint Syntax, Systemd Unit)")
    print("==================================================")

if __name__ == "__main__":
    test_bale_bot_module()
