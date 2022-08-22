#include "instance.h"
#include <boost/beast/core.hpp>
#include <boost/beast/websocket.hpp>
#include <boost/asio/connect.hpp>
#include <boost/asio/ip/tcp.hpp>
#include <iostream>

namespace beast = boost::beast;         // from <boost/beast.hpp>
namespace http = beast::http;           // from <boost/beast/http.hpp>
namespace websocket = beast::websocket; // from <boost/beast/websocket.hpp>
namespace net = boost::asio;            // from <boost/asio.hpp>
using tcp = boost::asio::ip::tcp;       // from <boost/asio/ip/tcp.hpp>

Instance::Instance(const std::string _target_host, const int _target_port) : target_host(_target_host), target_port(_target_port) {}

void Instance::run() const {
	std::cout << "Instance started" << std::endl;
	std::cout << "Connecting to " << target_host << ':' << target_port << std::endl;

	auto const text = "Big Hello";

	// The io_context is required for all I/O
	net::io_context ioc;

	// These objects perform our I/O
	tcp::resolver resolver{ioc};
	websocket::stream<tcp::socket> ws{ioc};

	// Look up the domain name
	auto const results = resolver.resolve(target_host, std::to_string(target_port));

	// Make the connection on the IP address we get from a lookup
	auto ep = net::connect(ws.next_layer(), results);

	// Update the host_ string. This will provide the value of the
	// Host HTTP header during the WebSocket handshake.
	// See https://tools.ietf.org/html/rfc7230#section-5.4
	std::string updated_host = target_host + ':' + std::to_string(ep.port());

	// Set a decorator to change the User-Agent of the handshake
	ws.set_option(websocket::stream_base::decorator(
		[](websocket::request_type& req)
		{
			req.set(http::field::user_agent,
				std::string(BOOST_BEAST_VERSION_STRING) +
					" websocket-client-coro");
		}));

	// Perform the websocket handshake
	ws.handshake(updated_host, "/");

	std::cout << "Connected to " << target_host << ':' << target_port << std::endl;

	// Send the message
	ws.write(net::buffer(std::string(text)));

	// This buffer will hold the incoming message
	beast::flat_buffer buffer;

	// Read a message into our buffer
	ws.read(buffer);

	// Close the WebSocket connection
	ws.close(websocket::close_code::normal);

	// If we get here then the connection is closed gracefully

	// The make_printable() function helps print a ConstBufferSequence
	std::cout << beast::make_printable(buffer.data()) << std::endl;
}
