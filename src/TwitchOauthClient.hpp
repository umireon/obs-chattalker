#pragma once

#include <thread>
#include <string>

#include <httplib.h>

class TwitchOauthClient {
public:
	TwitchOauthClient(void);
	~TwitchOauthClient(void);

	std::string buildAuthorizeURL(const std::string &state);
	void openAuthorizeScreen(int localPort);
	int startTokenReceiver(void);

	void handleGet(const httplib::Request &req, httplib::Response &res);
	void doCleanupThread(long timeout);
	void stopThreads(void);

private:
	httplib::Server tokenReceivingHttpServer;
	std::thread tokenReceiverThread;
	std::thread tokenReceiverCleanupThread;
	std::atomic_bool tokenReceiverStopping;
};
