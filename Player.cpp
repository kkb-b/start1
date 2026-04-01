#include "Player.h"

void Player::setname(const string& name) 
{
	// 인자 이름이 같으면 자신의 것을 표시할 땐 this -> 로 사용 
	this->name = name;
}

string Player::getName() 
{
	return this->name;
}
void Player::roll(Dice& dice1, Dice& dice2)
//void Player::roll(Dice dice1, Dice dice2) 
// 래퍼런스가 없는 상태로 호출 되면 Dice dice1(매개변수 선언)=dice1(인자); 로 저장됨.
// 값이 복사가 되기만 함. 함수가 끝나면 매개변수 객체 내부의 값을 참조할 수가없음
{
	dice1.roll();
	dice2.roll();

	total = dice1.getFaceValue() + dice2.getFaceValue();
}


int Player::getTotal()
{

	return this->total;
}