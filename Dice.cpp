#include "Dice.h"
#include <cstdlib>

void Dice::roll()
{
	faceValue = rand() % 6;
	// 난수를 설정할때 시드값을 안바꾸면 계속 같은 값이 나옴.
}

int Dice::getFaceValue()
{	
	return faceValue;
}
