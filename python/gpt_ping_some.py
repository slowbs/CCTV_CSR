import mysql.connector
import concurrent.futures
import subprocess
import platform

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
        # กรณี ping สำเร็จ แต่คอลัมน์ ping ยังเป็น 1 (ไม่สอดคล้อง) ให้ +1 ใน count_ping
        count_ping += 1
        status = "สถานะไม่สอดคล้อง (ตอบสนอง แต่คอลัมน์ ping = 1)"
    elif not success and ping_value == 0:
        # กรณี ping ไม่สำเร็จ แต่คอลัมน์ ping ยังเป็น 0 (ไม่สอดคล้อง) ให้ +1 ใน count_ping
        count_ping += 1
        status = "สถานะไม่สอดคล้อง (ไม่ตอบสนอง แต่คอลัมน์ ping = 0)"
    else:
        # ถ้าสถานะตรงกัน แต่ count_ping ยังไม่เกิน 2 จะลดค่า count_ping ลง 1
        if count_ping > 0:
            count_ping -= 1
        status = "สถานะตรงกัน (ไม่มีการเปลี่ยนแปลงค่า count_ping)"

    # อัปเดตสถานะในฐานข้อมูล
    update_status(id_, success, ping_value, count_ping)

    return data, status

# ฟังก์ชันในการอัปเดตสถานะในฐานข้อมูล
def update_status(id_, success, ping_value, count_ping):
    connection = mysql.connector.connect(
        host='localhost',
        user='slowbs',
        password='1596321',
        database='cctv'
    )
    cursor = connection.cursor()

    # อัปเดต count_ping ในฐานข้อมูล
    cursor.execute("UPDATE cctv SET count_ping = %s WHERE id = %s", (count_ping, id_))

    # หาก count_ping > 2 ให้ปรับปรุงค่า ping และรีเซ็ต count_ping
    if count_ping > 2:
        new_ping_value = 1 if not success else 0
        cursor.execute("UPDATE cctv SET ping = %s, count_ping = 0 WHERE id = %s", (new_ping_value, id_))

    connection.commit()
    cursor.close()
    connection.close()

# เชื่อมต่อกับฐานข้อมูลและดึงข้อมูลเฉพาะคอลัมน์ที่ต้องการ
def get_cctv_data():
    connection = mysql.connector.connect(
        host='localhost',
        user='slowbs',
        password='1596321',
        database='cctv'
    )
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT id, durable_no, ip, ping, count_ping FROM cctv")
    rows = cursor.fetchall()
    connection.close()
    return rows

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
