from snmp import Engine, SNMPv2c

with Engine(SNMPv2c, defaultCommunity=b"slowbs") as engine:
    localhost = engine.Manager("192.168.200.9")
    response = localhost.get("1.3.6.1.6.3.1.1.4.1", "1.3.6.1.2.1.1.5.0","1.3.6.1.4.1.55062.1.10.2.1.4")
    print(response)