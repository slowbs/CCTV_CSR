#!c:\Users\ADMIN\AppData\Local\Programs\Python\Python312\python.exe

from re import findall
from subprocess import Popen, PIPE

def ping (host,ping_count):

    for ip in host:
        data = ""
        output= Popen(f"ping {ip} -n {ping_count}", stdout=PIPE, encoding="utf-8")

        for line in output.stdout:
            data = data + line
            ping_test = findall("TTL", data)

        if ping_test:
            print(f"{ip} : Successful Ping")
        else:
            print(f"{ip} : Failed Ping")

nodes = []

for i in range(0, 200):
    ip = "192.168.200." + str(i)
    nodes.append(ip)
    # print(nodes)


ping(nodes,1)
# print(nodes)