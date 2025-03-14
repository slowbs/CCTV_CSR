import tkinter as tk
from tkinter.scrolledtext import ScrolledText
import threading
import time
import datetime
import concurrent.futures
import db_utils  # Import db_utils
import telegram_utils  # Import telegram_utils
import ping_utils  # Import ping_utils

# Global flag for loop control
running = False

def check_reboot_time(ip, now):
    """Check if the current time is within the reboot window for a specific IP."""
    return ip == '192.168.200.9' and 22 <= now.hour < 23 and 0 <= now.minute <= 10

def update_status(id_, success, ping_value, count_ping, ip, cctv_type, durable_no, durable_name, location, monitor, floor_name, log_callback):
    """Updates the device's status in the database and sends a Telegram message if the status changes."""
    now = datetime.datetime.now()
    status_changed = False
    new_ping_value = '1' if not success else '0'
    old_ping_value = ping_value
    
    # Handle Reboot time
    if check_reboot_time(ip, now):
        if not success:
            db_utils.update_device_count_ping(id_, 0)
            db_utils.log_ping_status(id_, new_ping_value, cctv_type, "Might reboot")
        else:
            db_utils.update_device_count_ping(id_, 0)
        return False, durable_no, ip, new_ping_value, old_ping_value # ไม่มีการเปลี่ยนแปลง
        
    # Update count_ping
    if success and ping_value == '1':
        count_ping += 1
    elif not success and ping_value == '0':
        count_ping += 1
    else:
        if count_ping > 0:
            count_ping -= 1
    
    db_utils.update_device_count_ping(id_, count_ping) #อัปเดต count_ping

    # Check if status should change
    if count_ping > 2:
        if new_ping_value != ping_value:
            db_utils.update_device_status(id_, new_ping_value, 0)
            message = (
                f"<b>{'กลับมาออนไลน์ ✅' if new_ping_value == '0' else 'ออฟไลน์ ❌'}</b>\n"
                f"หมายเลขครุภัณฑ์: <b>{durable_no}</b>\n"
                f"รายการ: {durable_name}\n"
                f"อาคาร: {floor_name}\n"
                f"สถานที่: {location}\n"
                f"Monitor: {monitor}\n"
                f"หมายเลข IP: {ip}\n"
                f"สถานะ: <b>{'ออนไลน์' if new_ping_value == '0' else 'ออฟไลน์'}</b>"
            )
            telegram_utils.send_telegram_message(message)
            db_utils.log_ping_status(id_, new_ping_value, cctv_type)
            status_changed = True
            return status_changed, durable_no, ip, new_ping_value, old_ping_value

    return status_changed, durable_no, ip, "", old_ping_value


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

    # Skip ping if IP is empty
    if not ip:
        return data, "Skipped (IP is Empty)", False, False, True, durable_no, ip, "", ping_value

    # Skip ping if in reboot time
    now = datetime.datetime.now()
    if check_reboot_time(ip, now):
        return data, "Skipped (Reboot time)", True, False, True, durable_no, ip, "", ping_value
        
    #ping device
    success = ping_utils.ping_device(ip)
    status = "สถานะตรงกัน" if success == (ping_value == '0') else "สถานะไม่สอดคล้อง"

    status_changed, changed_durable_no, changed_ip , changed_new_ping_value , old_ping_value = update_status(id_, success, ping_value, count_ping, ip, cctv_type,
                                   durable_no, durable_name, location, monitor, floor_name, log_callback)

    return data, status, success, status_changed, False, changed_durable_no, changed_ip, changed_new_ping_value, old_ping_value


def main_loop(log_callback):
    global running
    while running:
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
    text_area.insert(tk.END, msg + "\n")
    text_area.see(tk.END)

# Create main window
root = tk.Tk()
root.title("Devices Monitor")
root.iconbitmap('C:/xampp/htdocs/CCTV_CSR/python/monitor.ico')
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

start_loop()
root.mainloop()
