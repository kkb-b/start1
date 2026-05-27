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
