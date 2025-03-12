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

def ping_and_check(data, log_callback):  # เพิ่ม log_callback เป็น argument
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
    

    # ตรวจสอบ IP ว่าไม่ใช่ค่าว่าง
    if ip == '':
        #log_callback(f"Skipping ping for ID: {id_}, durable_no: {durable_no} - IP is Empty.")  # ลบ log ตรงนี้ออก
        
        return data, "Skipped (IP is Empty)", False, False, True # Skip and report as not success and status not change
    
    # ตรวจสอบ IP และช่วงเวลา 22:00-22:10
    if ip == '192.168.200.9' and 22 <= now.hour < 23:
        if 0 <= now.minute <= 10:
            #log_callback(f"Skipping ping for {ip}, durable_no: {durable_no} at {now.strftime('%H:%M')} (Reboot time).")  # ลบ log ตรงนี้ออก
            
            return data, "Skipped (Reboot time)", True, False, True # Skip for reboot time
    
    
    param_count = '-n' if platform.system().lower() == 'windows' else '-c'
    param_timeout = '-w' if platform.system().lower() == 'windows' else '-W'

    # เช็คว่าต้องใช้ creationflags หรือไม่
    creationflags = subprocess.CREATE_NO_WINDOW if platform.system().lower() == 'windows' else 0

    result = subprocess.run(['ping', param_count, '1', param_timeout, '500', ip],
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                            creationflags=creationflags)
    success = result.returncode == 0

    status = "สถานะตรงกัน" if success == (ping_value == '0') else "สถานะไม่สอดคล้อง"

    status_changed = update_status(id_, success, ping_value, count_ping, ip, cctv_type,
                                   durable_no, durable_name, location, monitor, floor_name, log_callback, status)  # ส่ง status ไปด้วย

    return data, status, success, status_changed, False # ไม่ Skip 

def update_status(id_, success, ping_value, count_ping, ip, cctv_type, durable_no, durable_name, location, monitor, floor_name, log_callback, status):  # เพิ่ม status เป็น argument
    connection = get_db_connection()
    cursor = connection.cursor()
    status_changed = False
    new_ping_value = '1' if not success else '0' # กำหนดค่า new_ping_value ตามความสำเร็จของการ ping
    
    try:
        now = datetime.datetime.now()
        # ตรวจสอบ IP และช่วงเวลา 22:00-22:10
        if ip == '192.168.200.9' and 22 <= now.hour < 23 and 0 <= now.minute <= 10:
            if not success:
                cursor.execute("UPDATE cctv SET count_ping = 0 WHERE id = %s", (id_))
                connection.commit()
                #log_callback(f"Device {ip}, durable_no: {durable_no} might reboot")  # ลบ log ตรงนี้ออก
                return False
            else:
                cursor.execute("UPDATE cctv SET count_ping = 0 WHERE id = %s", (id_))
                connection.commit()

        # อัปเดต count_ping ตาม logic ของ gpt_ping_telegram.pyw
        if success and ping_value == '1':
            count_ping += 1
        elif not success and ping_value == '0':
            count_ping += 1
        else:
            if count_ping > 0:
                count_ping -= 1
        
        cursor.execute("UPDATE cctv SET count_ping = %s WHERE id = %s", (count_ping, id_)) #อัปเดต count_ping
        connection.commit()
        
        if count_ping > 2: #ย้าย logic มาตรงนี้
            if new_ping_value != ping_value: #ตรวจสอบการเปลี่ยนสถานะ
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

        #if success != (ping_value == '0') and count_ping <= 2 : #ยังไม่เปลี่ยนสถานะ #ลบออก
            #log_callback(f"Device: {ip}, durable_no: {durable_no} ping : {success} - count : {count_ping} - status : {status} - (Not changed status)") # ย้าย log มาที่นี่
        #elif success == (ping_value == '0'): #สถานะตรงกัน #ลบออก
            #log_callback(f"Device: {ip}, durable_no: {durable_no} ping : {success} - count : {count_ping} - status : {status} - (correct status)") # เรียกตัวแปร status
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
        total_devices = len(data) #นับจำนวนอุปกรณ์ทั้งหมด
        online = 0
        offline = 0
        skip = 0
        status_changed_count = 0
        with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
            results = list(executor.map(ping_and_check, data, [lambda msg: None] * len(data)))
        for data, status, success, status_changed, skipped in results: #รับตัวแปร skipped
            if skipped: #ถูก skip
                skip += 1
            elif success: #ไม่ถูก skip และ online
                online += 1
            else: #ไม่ถูก skip และ offline
                offline += 1
          
            if status_changed:
                status_changed_count += 1
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        log_callback(f"Total Devices : {total_devices}, Online : {online}, Offline : {offline}, Skip : {skip}, Changed : {status_changed_count} at {now}")
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
