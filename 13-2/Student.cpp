#include "Student.h"

Student::Student(const string& sid, const string& name, const int& score)
	:sid(sid),name(name),score(score)
{
}

ostream& operator<<(ostream& out, const Student& std)
{
	out << std.sid << ", " << std.name << ", " << std.score << std::endl;
	return out;
}

bool operator>(Student& a1, Student& a2)
{
	return a1.score>a2.score;
}

bool operator==(Student& a1, Student& a2)
{
	return a1.score==a2.score;
}
