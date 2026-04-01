#pragma once
#include <string> // 꺽새가 있을 때는 sys direc 에 있음
#include "Dice.h" // 현재 디렉토리에 있을 때는 " " 를 이용.


using std::string;

class Player
{
private:
	string name;
	int total;
public:
	void setname(const string& name);
	string getName();
	void roll(Dice& dice1, Dice& dice2);
//	void roll(Dice dice1, Dice dice2);


	int getTotal();
};



