#include "instance.h"
#include <boost/program_options.hpp>
#include <iostream>
#include <string>

namespace po = boost::program_options;

// Sends a WebSocket message and prints the response
int main(int argc, char* argv[])
{
	// Declare the supported options.
	po::options_description desc("Allowed options");
	desc.add_options()
		("help", "produce help message")
		("target_host", po::value<std::string>(), "target instance's host")
		("target_port", po::value<int>(), "target instance's port")
	;

	po::variables_map vm;
	po::store(po::parse_command_line(argc, argv, desc), vm);
	po::notify(vm);    

	if (vm.count("help")) {
		std::cout << desc << std::endl;
		return 1;
	}

	if (vm.count("target_host") and vm.count("target_port")) {
		const std::string host = vm["target_host"].as<std::string>();
		const int port = vm["target_port"].as<int>();
		std::cout << "Target instance was set to " << host << ':' << port << std::endl;
		Instance(host, port).run();
	} else {
		std::cout << "Target host and/or port was not set" << std::endl;
	}
}
