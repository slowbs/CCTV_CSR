from multiping import MultiPing

# Create a MultiPing object to test three hosts / addresses
mp = MultiPing(["8.8.8.8", "youtube.com", "127.0.0.1"])

# Send the pings to those addresses
mp.send()

# With a 1 second timout, wait for responses (may return sooner if all
# results are received).
responses, no_responses = mp.receive(1)