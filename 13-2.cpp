#include <iostream>
#include <list>
#include "Student.h"

using namespace std;

//c style int (*func)(int,int)

int add(int a, int b) {
	return a + b;
}

int sub(int a, int b) {
	return a - b;
}
template<typename T>
int calcuate(int a, int b, T func) {
	return func(a, b);
}


bool sortdesc(int a, int b) {
	return a > b;
}

bool ga(int x) {
	return x < 40;
}

bool ga2(int x) {
	return x == 50;
}
int main() {

	list<Student>stdlist;

	stdlist.push_back(Student("greenjoa1", "홍길동", 50));
	stdlist.push_back(Student("greenjoa3", "이길동", 90));
	stdlist.push_back(Student("greenjoa5", "박길동", 60));
	stdlist.push_back(Student("greenjoa4", "차길동", 40));
	stdlist.push_back(Student("greenjoa2", "고길동", 20));


	stdlist.sort(greater<>());
	
	for (auto it = stdlist.begin(); it != stdlist.end();it++) {
		cout << *it << " ";
	}

	stdlist.remove_if(bind(equal_to<>(),));
	//stdlist.remove_if(); //박길동 지우기

	/*list<int> list1 = { 10,50,20,40,30,100,70 };*/

	//list1.sort(sortdesc); c style

	//list1.sort(greater<>()); c++ style

	//list1.remove_if(std::bind(std::equal_to<>(),std::placeholders::_1,50)); //( ) 안에 bool 값이 들어가야한다.

	// lessthan 을 쓰고 싶은데 이항연산자라서
	//remove_if 에는 단항 연산자가 들어가야한다.

	/*for (auto it = list1.begin(); it != list1.end();it++) {
		cout << *it << " ";
	}*/
	/*
	plus<int> p1;

	minus<int>m1;


	cout << calcuate(10, 20, p1) << endl;
	cout << calcuate(10, 20, m1) << endl;*/

	return 0;
}