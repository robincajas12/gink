instance: gink
	./gink --target_host=localhost --target_port=8080

gink: instance.h gink.cpp instance.cpp
	g++ -march=native -O3 -pedantic-errors -pthread -std=c++17 gink.cpp instance.cpp -lboost_program_options -o gink

clean:
	rm gink
