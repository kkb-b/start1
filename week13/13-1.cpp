#include <iostream>
#include <map>
#include "Student.h"

using namespace std;

int main() {

	map<string, Student> cppclassA;
	cppclassA["greenjoa1"] = Student("greenjoa1", "홍길동", 60);
	cppclassA.insert({ "greenjoa3",Student("greenjoa3","이길동",80) });
	cppclassA.emplace("greenjoa4", Student("greenjoa4", "최길동", 75));
	cppclassA.insert({ "greenjoa2",Student("greenjoa2","김길동",70) });

	//자동으로 데이터가 정렬되어서 출력된다.

	// 삽입 순서가 중요하면 map을 사용해서는 안됨.

	for (const auto& p : cppclassA) {
		cout << p.first<< " : "<< p.second << endl;
	}

	auto pos=cppclassA.find("greenjoa3");
	if (pos != cppclassA.end()) {
		// cout << *pos << endl;  원래는 해당 포인터의 값을 출력하면됬는데,
		// pair 객체에 대한 정보를 우리가 출력해야함
		cout << pos->first << " : " << pos->second << endl;
		//주의해라잉
	}
	else {
		cout << "찾지 못했습니다" << endl;
	}

	map<string, Student> cppclassB;
	cppclassB.insert({ "greenjoa5",Student("greenjoa5","박길동",70) });
	cppclassB.emplace("greenjoa6", Student("greenjoa6", "고길동", 85));
	cppclassB.insert({ "greenjoa3",Student("greenjoa3","이길동",75) });

	cout << "============cppB============" << endl;
	
	for (const auto& p : cppclassB) {
		cout << p.first << " : " << p.second << endl;
	}

	cppclassA.merge(cppclassB);

	cout << "============merge============" << endl;
	
	for (const auto& p : cppclassA) {
		cout << p.first << " : " << p.second << endl;
	}

	cout << "============cppB============" << endl;

	for (const auto& p : cppclassB) {
		cout << p.first << " : " << p.second << endl;
	}

	auto node = cppclassA.extract("greenjoa1");
	
	// 추출하면 node는 pointer를 갖는건데, move를 하지 않으면 해당 포인터를 가리키는 node가 
	// call by value로 node 객체가 복사가 되기 때문이라고 이해했는데, 이게 맞나?
	cout << node.key() << ", " << node.mapped() << endl;

	cppclassB.insert(move(node));
	//move(node) 이후에는 node가 더이상 데이터를 가리키고 있지 않으니까 이후에 node.mapped하면 nullptr에 대한 접근이다.



	cout << "============extract============" << endl;

	for (const auto& p : cppclassA) {
		cout << p.first << " : " << p.second << endl;
	}

	cout << "============cppB============" << endl;

	for (const auto& [key,value] : cppclassB) {
		cout << key << " : " << value << endl;
	}

}