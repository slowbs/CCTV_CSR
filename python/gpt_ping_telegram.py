import tkinter as tk
from tkinter.scrolledtext import ScrolledText
import threading
import time
import datetime
import concurrent.futures
import db_utils
import telegram_utils
import ping_utils
import logging
from logging.handlers import RotatingFileHandler
import os

import sys

# Setup Logging
if getattr(sys, 'frozen', False):
    # If the application is run as a bundle, the PyInstaller bootloader
    # extends the sys module by a flag frozen=True and sets the app 
    # path into variable _MEIPASS'.
    application_path = os.path.dirname(sys.executable)
else:
    application_path = os.path.dirname(os.path.abspath(__file__))

log_file_path = os.path.join(application_path, 'monitor.log')
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler(log_file_path, maxBytes=5*1024*1024, backupCount=3, encoding='utf-8'),
        logging.StreamHandler()
    ]
)

# Global flag for loop control
running = False
loop_thread = None



def update_status(id_, success, ping_value, count_ping, ip, cctv_type, durable_no, durable_name, location, monitor, floor_name, log_callback):
    """Updates the device's status in the database and sends a Telegram message if the status changes."""
    now = datetime.datetime.now()
    status_changed = False
    new_ping_value_based_on_current_ping = '1' if not success else '0' # สถานะที่ควรจะเป็นใน DB ตามผล ping ปัจจุบัน
    old_ping_value_from_db = ping_value # สถานะเดิมที่อ่านมาจาก DB

    # Update count_ping
    if (success and old_ping_value_from_db == '1') or \
       (not success and old_ping_value_from_db == '0'):
        count_ping += 1
    else:
        if count_ping > 0:
            count_ping -= 1
    
    db_utils.update_device_count_ping(id_, count_ping) #อัปเดต count_ping

    # Check if status should change
    if count_ping > 2:
        if new_ping_value_based_on_current_ping != old_ping_value_from_db:
            db_utils.update_device_status(id_, new_ping_value_based_on_current_ping, 0) # อัปเดตสถานะและรีเซ็ต count_ping
            message = (
                f"<b>{'กลับมาออนไลน์ ✅' if new_ping_value_based_on_current_ping == '0' else 'ออฟไลน์ ❌'}</b>\n"
                f"หมายเลขครุภัณฑ์: <b>{durable_no}</b>\n"
                f"รายการ: {durable_name}\n"
                f"อาคาร: {floor_name}\n"
                f"สถานที่: {location}\n"
                f"Monitor: {monitor}\n"
                f"หมายเลข IP: {ip}\n"
                f"สถานะ: <b>{'ออนไลน์' if new_ping_value_based_on_current_ping == '0' else 'ออฟไลน์'}</b>"
            )
            telegram_utils.send_telegram_message(message)
            db_utils.log_ping_status(id_, new_ping_value_based_on_current_ping, cctv_type)
            status_changed = True
            return status_changed, durable_no, ip, new_ping_value_based_on_current_ping, old_ping_value_from_db

    return status_changed, durable_no, ip, new_ping_value_based_on_current_ping, old_ping_value_from_db


def ping_and_check(data, log_callback):
    """Pings a device and checks its status, then updates the database if necessary."""
    ip = data['ip']
    id_ = data['id']
    ping_value = data['ping']
    count_ping = data['count_ping']
    cctv_type = data['type']
    floor_name = data['floor_name']
    durable_no = data['durable_no']
    durable_name = data['durable_name']
    location = data['location']
    monitor = data['monitor']

    # Auto-Maintenance for Reboot (IP: 192.168.200.9) - MUST BE CHECKED FIRST
    now = datetime.datetime.now()
    if ip == '192.168.200.9':
        # Enter Reboot Window (22:00 - 22:10)
        if 22 <= now.hour < 23 and 0 <= now.minute <= 10:
            if data.get('maintenance_mode', 0) == 0:
                db_utils.set_maintenance_mode(id_, 1)
                log_callback(f"Auto-enabled Maintenance Mode for {ip} (Reboot Window)")
                data['maintenance_mode'] = 1 # Update data for this run
            # Always skip during this window
            return data, "Skipped (Auto-Maintenance)", False, False, True, durable_no, ip, ping_value, ping_value
        
        # Exit Reboot Window (22:11 - 22:30) - Force OFF
        elif 22 <= now.hour < 23 and 11 <= now.minute <= 30:
            if data.get('maintenance_mode', 0) == 1:
                db_utils.set_maintenance_mode(id_, 0)
                log_callback(f"Auto-disabled Maintenance Mode for {ip} (Reboot Window Ended)")
                data['maintenance_mode'] = 0 # Update data for this run
                # After disabling, continue to the normal ping process below

    # Skip ping if Status is not Active (1 = ใช้งาน)
    cctv_status = data.get('status', '1')
    if str(cctv_status) != '1':
        return data, f"Skipped (Status: {cctv_status})", False, False, True, durable_no, ip, ping_value, ping_value

    # Skip ping if IP is empty
    if not ip:
        return data, "Skipped (IP is Empty)", False, False, True, durable_no, ip, "", ping_value

    # Skip ping if in Maintenance Mode
    maintenance_mode = data.get('maintenance_mode', 0)
    if maintenance_mode == 1:
        return data, "Skipped (Maintenance Mode)", False, False, True, durable_no, ip, ping_value, ping_value

    #ping device
    success = ping_utils.ping_device(ip, log_callback=log_callback) # Pass log_callback

    # Log the raw ping result for this IP
    # log_callback(f"IP: {ip} - Ping attempt result: {'Success (Online)' if success else 'Failed (Offline)'}") # Commented out to hide per-IP log

    status = "สถานะตรงกัน" if success == (ping_value == '0') else "สถานะไม่สอดคล้อง"

    status_changed, changed_durable_no, changed_ip , changed_new_ping_value , old_ping_value = update_status(id_, success, ping_value, count_ping, ip, cctv_type,
                                   durable_no, durable_name, location, monitor, floor_name, log_callback)

    return data, status, success, status_changed, False, changed_durable_no, changed_ip, changed_new_ping_value, old_ping_value


def main_loop(log_callback):
    global running
    while running:
        try:
            data = db_utils.get_cctv_data()
            total_devices = len(data)
            online = 0
            offline = 0
            skip = 0
            status_changed_count = 0
            changed_devices = []

            with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
                results = list(executor.map(ping_and_check, data, [log_callback] * len(data)))

            for data, status, success, status_changed, skipped, durable_no, ip, new_ping_value, old_ping_value in results:
                if skipped:
                    skip += 1
                elif success:
                    online += 1
                else:
                    offline += 1

                if status_changed:
                    status_changed_count += 1
                    changed_devices.append(f"- Changed: durable_no: {durable_no}, ip: {ip}, status: {'Offline' if old_ping_value == '1' else 'Online'} -> {'Online' if new_ping_value == '0' else 'Offline'}")

            now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
            log_callback(f"Total Devices : {total_devices}, Online : {online}, Offline : {offline}, Skip : {skip}, Changed : {status_changed_count} at {now}")
            for device_info in changed_devices:
                log_callback(device_info)

            changed_devices.clear()
            time.sleep(60)
        except Exception as e:
            error_msg = f"An error occurred in main_loop: {e}"
            log_callback(error_msg)
            logging.exception("Exception in main_loop:") # Log full traceback to file
            time.sleep(10)  # Wait for a while before retrying

# GUI
def start_loop():
    global running, loop_thread
    if not running:
        running = True
        loop_thread = threading.Thread(target=main_loop, args=(log_message,))
        loop_thread.daemon = True
        loop_thread.start()
        log_message("Started monitoring.")

def stop_loop():
    global running
    running = False
    log_message("Stopped monitoring.")

def log_message(msg):
    # Update GUI
    text_area.insert(tk.END, msg + "\n")
    text_area.see(tk.END)
    # Write to File Log
    logging.info(msg)

# Create main window
root = tk.Tk()
root.title("Devices Monitor")
try:
    root.iconbitmap('C:/xampp/htdocs/CCTV_CSR/python/monitor.ico')
except Exception as e:
    logging.warning(f"Could not load icon: {e}")

root.configure(bg="#f0f0f0")

# Define main font
main_font = ("Helvetica", 12)
button_font = ("Helvetica", 14, "bold")

# Main frame
main_frame = tk.Frame(root, bg="#f0f0f0", padx=20, pady=20)
main_frame.pack(fill=tk.BOTH, expand=True)

# Program label
program_label = tk.Label(main_frame, text="Devices Status Monitor", font=("Helvetica", 16, "bold"), bg="#f0f0f0", fg="#333333")
program_label.grid(row=0, column=0, columnspan=2, pady=(0, 20))

# Button frame
button_frame = tk.Frame(main_frame, bg="#f0f0f0")
button_frame.grid(row=1, column=0, columnspan=2, pady=(0, 20), sticky="ew")

# Start button
start_button = tk.Button(button_frame, text="Start", command=start_loop, font=button_font, bg="#4CAF50", fg="white", padx=20, pady=10, bd=0)
start_button.grid(row=0, column=0, padx=10)

# Stop button
stop_button = tk.Button(button_frame, text="Stop", command=stop_loop, font=button_font, bg="#F44336", fg="white", padx=20, pady=10, bd=0)
stop_button.grid(row=0, column=1, padx=10)

# Log frame
log_frame = tk.Frame(main_frame, bg="#ffffff", bd=1, relief=tk.SOLID)
log_frame.grid(row=2, column=0, columnspan=2, sticky="nsew")

# Log label
log_label = tk.Label(log_frame, text="Log", font=("Helvetica", 12, "bold"), bg="#ffffff", fg="#333333")
log_label.pack(pady=(10, 0))

# ScrolledText for log
text_area = ScrolledText(log_frame, width=100, height=20, font=main_font, wrap=tk.WORD, bd=0)
text_area.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

# Make frame expandable
main_frame.grid_rowconfigure(2, weight=1)
main_frame.grid_columnconfigure(0, weight=1)

# Allow log_frame and text_area to expand
log_frame.pack_propagate(False)
log_frame.configure(width=600, height=400)

if __name__ == "__main__":
    start_loop()
    root.mainloop()
