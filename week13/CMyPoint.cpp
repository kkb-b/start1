#include "CMyPoint.h"
#include <iostream>

using namespace std;

ostream& operator<<(ostream& out, const CMyPoint& pt) {
	out << pt.getX() << "," << pt.getY();
	return out;
}

//bool operator>(const CMyPoint& pt1, const CMyPoint& pt2)
//{
//	if (pt1.getX() < pt2.getX()) {
//		return false;
//	}
//	return true;
//}
bool CMyPoint::operator<(CMyPoint& other) {
	return x < other.x;
}
bool CMyPoint::operator==(CMyPoint& pt)
{
	return x==pt.x&&y==pt.y;
}
;

CMyPoint::CMyPoint() :x(0), y(0) {
	cout << x << "," << y << "디폴트 생성자" << endl;
}
CMyPoint::~CMyPoint() {
	cout << x << "," << y << "소멸자" << endl;
}
CMyPoint::CMyPoint(const int& x, const int& y) :x(x), y(y) {
	cout << x << "," << y << "생성자" << endl;
}

CMyPoint::CMyPoint(const CMyPoint& pt) :x(pt.x), y(pt.y) {
	cout << x << "," << y << "복사생성자" << endl;
}

CMyPoint::CMyPoint(CMyPoint&& pt) noexcept :x(pt.x), y(pt.y)
{
	cout << x << "," << y << "이동 생성자" << endl;
}

