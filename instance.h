#pragma once

#include <string>

class Instance {
public:
	Instance(std::string target_host, int target_port);
	void run() const;

private:
	const std::string target_host;
	const int target_port;
};
