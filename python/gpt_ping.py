import concurrent.futures
import subprocess

# ฟังก์ชันที่ใช้ในการ ping IP
def ping(ip):
    result = subprocess.run(['ping', '-n', '1', ip], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return ip, result.returncode == 0

# กำหนด IP Address ตั้งแต่ 192.168.200.1 ถึง 192.168.200.10
ip_addresses = [f"192.168.200.{i}" for i in range(1, 11)]

# ใช้ concurrent.futures เพื่อทำการ ping พร้อมกัน
with concurrent.futures.ThreadPoolExecutor() as executor:
    results = list(executor.map(ping, ip_addresses))

# แสดงผลลัพธ์
for ip, success in results:
    if success:
        print(f"{ip} ตอบสนอง (reachable)")
    else:
        print(f"{ip} ไม่ตอบสนอง (unreachable)")

input()