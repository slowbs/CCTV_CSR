import tkinter as tk
from tkinter.scrolledtext import ScrolledText
import threading
import time
import datetime
import mysql.connector
import concurrent.futures
import subprocess
import platform
import requests
import os  # เพิ่ม import os

# Global flag สำหรับควบคุม loop
running = False

# ตั้งค่า Telegram Bot Token และ Chat ID
TELEGRAM_BOT_TOKEN = '7725475514:AAESQ0vZWNyphDaa630sQaaLgvl7dMkCvuo'
TELEGRAM_CHAT_ID = '6334503369'

def send_telegram_message(message):
    url = f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage'
    payload = {
        'chat_id': TELEGRAM_CHAT_ID,
        'text': message,
        'parse_mode': 'HTML'
    }
    response = requests.post(url, json=payload)
    if response.status_code != 200:
        print(f"Failed to send message: {response.text}")
    else:
        print("Message sent successfully!")

def get_db_connection():
    return mysql.connector.connect(
        host='localhost',
        user='slowbs',
        password='1596321',
        database='cctv'
    )

def ping_and_check(data):
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
    
    now = datetime.datetime.now()
    # ตรวจสอบ IP และช่วงเวลา 22:00-22:10
    if ip == '192.168.200.9' and 22 <= now.hour < 23:
        if 0 <= now.minute <= 10:
            log_callback(f"Skipping ping for {ip} at {now.strftime('%H:%M')} (Reboot time).")
            return data, "Skipped (Reboot time)", True, False  # ข้ามการ ping และแจ้งว่าข้าม
    
    param_count = '-n' if platform.system().lower() == 'windows' else '-c'
    param_timeout = '-w' if platform.system().lower() == 'windows' else '-W'
    result = subprocess.run(['ping', param_count, '1', param_timeout, '500', ip],
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                            creationflags=subprocess.CREATE_NO_WINDOW)
    success = result.returncode == 0
    
    status = "สถานะตรงกัน" if success == (ping_value == '0') else "สถานะไม่สอดคล้อง"
    
    status_changed = update_status(id_, success, ping_value, count_ping, ip, cctv_type,
                               durable_no, durable_name, location, monitor, floor_name)
    
    return data, status, success, status_changed

def update_status(id_, success, ping_value, count_ping, ip, cctv_type, durable_no, durable_name, location, monitor, floor_name):
    connection = get_db_connection()
    cursor = connection.cursor()
    status_changed = False
    new_ping_value = '1' if not success else '0'
    try:
        now = datetime.datetime.now()
        if ip == '192.168.200.9' and 22 <= now.hour < 23 and 0 <= now.minute <= 10:
            if not success:
              cursor.execute("UPDATE cctv SET count_ping = 0 WHERE id = %s", (id_))
              connection.commit()
              log_callback(f"Device {ip} might reboot")
              return False
            else:
              cursor.execute("UPDATE cctv SET count_ping = 0 WHERE id = %s", (id_))
              connection.commit()
        else:
             cursor.execute("UPDATE cctv SET count_ping = %s WHERE id = %s", (count_ping, id_))
             connection.commit()

        if new_ping_value != ping_value:
            if count_ping > 2:
              cursor.execute("UPDATE cctv SET ping = %s, count_ping = 0 WHERE id = %s", (new_ping_value, id_))
              connection.commit()
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
              send_telegram_message(message)
              log_ping_status(id_, new_ping_value, cctv_type)
              status_changed = True
    finally:
        cursor.close()
        connection.close()
    return status_changed

def log_ping_status(cctv_id, ping_checked, cctv_type):
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        cursor.execute("INSERT INTO log_ping (cctv_id, ping_checked, type) VALUES (%s, %s, %s)",
                       (cctv_id, ping_checked, cctv_type))
        connection.commit()
    finally:
        cursor.close()
        connection.close()

def get_cctv_data():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""SELECT cctv.id, cctv.durable_no, cctv.ip, cctv.ping, cctv.count_ping, cctv.type, 
                          cctv.durable_name, cctv.location, cctv.monitor, floor.floor_name
                          FROM cctv 
                          JOIN floor ON cctv.floor = floor.floor_id""")
        rows = cursor.fetchall()
    finally:
        cursor.close()
        connection.close()
    return rows

def main_loop(log_callback):
    global running
    while running:
        data = get_cctv_data()
        responsive_count = 0
        non_responsive_count = 0
        status_changed_count = 0
        with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
            results = list(executor.map(ping_and_check, data))
        for data, status, success, status_changed in results:
            if success:
                responsive_count += 1
            else:
                non_responsive_count += 1
            if status_changed:
                status_changed_count += 1
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_callback(f"Responsive: {responsive_count}, Non-responsive: {non_responsive_count}, Changed: {status_changed_count} at {now}")
        time.sleep(60)

# GUI ด้วย Tkinter
import tkinter as tk
from tkinter.scrolledtext import ScrolledText

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

# สร้างหน้าต่างหลัก
root = tk.Tk()
root.title("Devices Monitor")
root.iconbitmap('C:/xampp/htdocs/CCTV_CSR/python/monitor.ico')
root.configure(bg="#f0f0f0")  # กำหนดสีพื้นหลัง

# กำหนด font หลัก
main_font = ("Helvetica", 12)
button_font = ("Helvetica", 14, "bold")

# Frame หลักสำหรับปุ่มและ log
main_frame = tk.Frame(root, bg="#f0f0f0", padx=20, pady=20)
main_frame.pack(fill=tk.BOTH, expand=True)

# Label ชื่อโปรแกรม
program_label = tk.Label(main_frame, text="Devices Status Monitor", font=("Helvetica", 16, "bold"),
                         bg="#f0f0f0", fg="#333333")
program_label.grid(row=0, column=0, columnspan=2, pady=(0, 20))  # วางไว้ row=0

# Frame สำหรับปุ่ม
button_frame = tk.Frame(main_frame, bg="#f0f0f0")
button_frame.grid(row=1, column=0, columnspan=2, pady=(0, 20), sticky="ew")  # วางด้านล่าง row=1

# ปุ่ม Start
start_button = tk.Button(button_frame, text="Start", command=start_loop, font=button_font, bg="#4CAF50",
                         fg="white", padx=20, pady=10, bd=0)
start_button.grid(row=0, column=0, padx=10)

# ปุ่ม Stop
stop_button = tk.Button(button_frame, text="Stop", command=stop_loop, font=button_font, bg="#F44336",
                        fg="white", padx=20, pady=10, bd=0)
stop_button.grid(row=0, column=1, padx=10)

# Frame สำหรับพื้นที่แสดง log
log_frame = tk.Frame(main_frame, bg="#ffffff", bd=1, relief=tk.SOLID)  # เพิ่มกรอบ
log_frame.grid(row=2, column=0, columnspan=2, sticky="nsew")  # ขยายตามแนวตั้งและแนวนอน row=2

# Label สำหรับ log
log_label = tk.Label(log_frame, text="Log", font=("Helvetica", 12, "bold"), bg="#ffffff", fg="#333333")
log_label.pack(pady=(10, 0))

# ScrolledText สำหรับแสดง log
text_area = ScrolledText(log_frame, width=100, height=20, font=main_font, wrap=tk.WORD, bd=0)
text_area.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

# ทำให้ frame ขยายได้
main_frame.grid_rowconfigure(2, weight=1)  # เปลี่ยนจาก 1 เป็น 2
main_frame.grid_columnconfigure(0, weight=1)

# ให้ log_frame และ text_area สามารถขยายได้ตามหน้าต่าง
log_frame.pack_propagate(False)
log_frame.configure(width=600, height=400)

start_loop()
root.mainloop()
