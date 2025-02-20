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

    param_count = '-n' if platform.system().lower() == 'windows' else '-c'
    param_timeout = '-w' if platform.system().lower() == 'windows' else '-W'

    result = subprocess.run(['ping', param_count, '1', param_timeout, '500', ip],
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    success = result.returncode == 0

    if success and ping_value == '1':
        count_ping += 1
        status = "สถานะไม่สอดคล้อง (ตอบสนอง แต่คอลัมน์ ping = 1)"
    elif not success and ping_value == '0':
        count_ping += 1
        status = "สถานะไม่สอดคล้อง (ไม่ตอบสนอง แต่คอลัมน์ ping = 0)"
    else:
        if count_ping > 0:
            count_ping -= 1
        status = "สถานะตรงกัน (ไม่มีการเปลี่ยนแปลงค่า count_ping)"
    
    status_changed = update_status(id_, success, ping_value, count_ping, ip, cctv_type, durable_no, durable_name, location, monitor, floor_name)
    return data, status, success, status_changed

def update_status(id_, success, ping_value, count_ping, ip, cctv_type, durable_no, durable_name, location, monitor, floor_name):
    connection = get_db_connection()
    cursor = connection.cursor()
    status_changed = False
    try:
        cursor.execute("UPDATE cctv SET count_ping = %s WHERE id = %s", (count_ping, id_))
        if count_ping > 2:
            new_ping_value = '1' if not success else '0'
            if new_ping_value != ping_value:
                cursor.execute("UPDATE cctv SET ping = %s, count_ping = 0 WHERE id = %s", (new_ping_value, id_))
                message = (
                    f"<b>{'กลับมาออนไลน์ ✅' if new_ping_value=='0' else 'ออฟไลน์ ❌'}</b>\n"
                    f"หมายเลขครุภัณฑ์: <b>{durable_no}</b>\n"
                    f"รายการ: {durable_name}\n"
                    f"อาคาร: {floor_name}\n"
                    f"สถานที่: {location}\n"
                    f"Monitor: {monitor}\n"
                    f"หมายเลข IP: {ip}\n"
                    f"สถานะ: <b>{'ออนไลน์' if new_ping_value=='0' else 'ออฟไลน์'}</b>"
                )
                send_telegram_message(message)
                log_ping_status(id_, new_ping_value, cctv_type)
                status_changed = True
        connection.commit()
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
        time.sleep(120)

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

# สร้างหน้าต่าง GUI
root = tk.Tk()
root.title("CCTV Monitor")

frame = tk.Frame(root)
frame.pack(fill=tk.BOTH, expand=True)

start_button = tk.Button(frame, text="Start", command=start_loop)
start_button.pack(side=tk.LEFT, padx=10, pady=10)

stop_button = tk.Button(frame, text="Stop", command=stop_loop)
stop_button.pack(side=tk.LEFT, padx=10, pady=10)

text_area = ScrolledText(frame, width=80, height=20)
text_area.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

root.mainloop()
