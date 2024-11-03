import mysql.connector
import concurrent.futures
import subprocess
import platform
import requests
import time

# ตั้งค่า LINE Notify token
LINE_NOTIFY_TOKEN = '2o8uKi8xrEoTYDmGHuEW6W2j7oxY8bheDApgfYRUJo4'

# ฟังก์ชันส่งการแจ้งเตือนผ่าน LINE Notify
def send_line_notification(message):
    url = 'https://notify-api.line.me/api/notify'
    headers = {
        'Authorization': f'Bearer {LINE_NOTIFY_TOKEN}'
    }
    data = {
        'message': message
    }
    requests.post(url, headers=headers, data=data)

# ฟังก์ชันสำหรับการเชื่อมต่อฐานข้อมูล
def get_db_connection():
    return mysql.connector.connect(
        host='localhost',
        user='slowbs',
        password='1596321',
        database='cctv'
    )

# ฟังก์ชันที่ใช้ในการ ping IP และตรวจสอบค่าสถานะการ ping กับข้อมูลในคอลัมน์ ping
def ping_and_check(data):
    ip = data['ip']
    id_ = data['id']
    ping_value = data['ping']  # ค่าปัจจุบันของคอลัมน์ ping ในฐานข้อมูล
    count_ping = data['count_ping']  # ค่าปัจจุบันของคอลัมน์ count_ping

    # ตรวจสอบระบบปฏิบัติการและเลือกคำสั่ง ping ที่เหมาะสม
    param_count = '-n' if platform.system().lower() == 'windows' else '-c'
    param_timeout = '-w' if platform.system().lower() == 'windows' else '-W'
    
    # ทำการ ping IP โดยกำหนด Timeout เป็น 500 ms
    result = subprocess.run(['ping', param_count, '1', param_timeout, '500', ip],
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    success = result.returncode == 0
    
    # ตรวจสอบความสอดคล้องระหว่างสถานะการ ping กับคอลัมน์ ping
    if success and ping_value == 1:
        count_ping += 1
        status = "สถานะไม่สอดคล้อง (ตอบสนอง แต่คอลัมน์ ping = 1)"
    elif not success and ping_value == 0:
        count_ping += 1
        status = "สถานะไม่สอดคล้อง (ไม่ตอบสนอง แต่คอลัมน์ ping = 0)"
    else:
        if count_ping > 0:
            count_ping -= 1
        status = "สถานะตรงกัน (ไม่มีการเปลี่ยนแปลงค่า count_ping)"

    # อัปเดตสถานะในฐานข้อมูล
    update_status(id_, success, ping_value, count_ping, ip)

    return data, status

# ฟังก์ชันในการอัปเดตสถานะในฐานข้อมูล
def update_status(id_, success, ping_value, count_ping, ip):
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        # อัปเดต count_ping ในฐานข้อมูล
        cursor.execute("UPDATE cctv SET count_ping = %s WHERE id = %s", (count_ping, id_))

        # หาก count_ping > 2 ให้ปรับปรุงค่า ping และรีเซ็ต count_ping
        if count_ping > 2:
            new_ping_value = 1 if not success else 0
            if new_ping_value != ping_value:
                # อัปเดตค่า ping ในฐานข้อมูล
                cursor.execute("UPDATE cctv SET ping = %s, count_ping = 0 WHERE id = %s", (new_ping_value, id_))
                # ส่งการแจ้งเตือนไปยัง LINE Notify
                message = f"อัปเดตสถานะ ping สำหรับ IP: {ip} เป็น {'ตอบสนอง' if new_ping_value == 0 else 'ไม่ตอบสนอง'}"
                send_line_notification(message)
        
        connection.commit()  # ยืนยันการเปลี่ยนแปลง
    finally:
        cursor.close()
        connection.close()

# ฟังก์ชันดึงข้อมูลจากฐานข้อมูล
def get_cctv_data():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute("SELECT id, durable_no, ip, ping, count_ping FROM cctv")
        rows = cursor.fetchall()
    finally:
        cursor.close()
        connection.close()

    return rows

while True:
    # ดึงข้อมูลจากตาราง cctv เฉพาะคอลัมน์ที่ต้องการ
    cctv_data = get_cctv_data()

    # ใช้ concurrent.futures เพื่อทำการ ping และตรวจสอบสถานะพร้อมกัน โดยเพิ่มจำนวน Threads
    with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
        results = list(executor.map(ping_and_check, cctv_data))

    # แสดงผลลัพธ์
    for data, status in results:
        id_ = data['id']
        durable_no = data['durable_no']
        ip = data['ip']
        print(f"ID: {id_}, Durable No: {durable_no}, IP: {ip} - {status}")

    # รอ 2 นาที (120 วินาที) ก่อนทำงานใหม่
    time.sleep(120)
