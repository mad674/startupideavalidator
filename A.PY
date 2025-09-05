import socket, threading

client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
client.connect(('10.11.11.2', 5555))  # Replace with server IP

def receive():
    while True:
        try:
            msg = client.recv(1024).decode()
            print(msg)
        except:
            break
        
threading.Thread(target=receive).start()

while True:
    msg = input()
    client.send(msg.encode())