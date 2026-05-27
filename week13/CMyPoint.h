#pragma once
#include <iostream>
using namespace std;
class CMyPoint
{
private:
	int x, y;
public:
	CMyPoint();
	~CMyPoint();
	CMyPoint(const int& x, const int& y);
	CMyPoint(const CMyPoint& pt);
	CMyPoint(CMyPoint&& k)noexcept;
	int getX() const {
		return x;
	}
	int getY() const {
		return y;
	}
	bool operator<(CMyPoint& other);
	bool operator==(CMyPoint& x);
};

ostream& operator<<(ostream& out, const CMyPoint& pt);
/*

bool operator>(const CMyPoint& pt1, const CMyPoint& pt2);*/




