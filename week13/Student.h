#pragma once
#include <string>
#include <iostream>
using std::string;
using std::ostream;

class Student
{
private:
	string sid;
	string name;
	int score;
public:
	Student() = default;
	~Student() = default;
	Student(const string& sid,const string& name,const int& score);
	friend ostream& operator<<(ostream& out, const Student& std);
};

