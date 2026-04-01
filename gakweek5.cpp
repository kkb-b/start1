#include <iostream>
#include "Dice.h"
#include "Player.h"
#include <ctime>

using namespace std;


int main() {
	srand(unsigned(time(NULL)));
	//¸ðµç ÄÚµåÁß¿¡¼­ ÇÑ¹ø¸¸ ÀÌ·¸°Ô ¼±¾ðÇØÁÖ¸é µÊ.
	Dice dice1, dice2;

	Player p1, p2;

	p1.setname("È«±æµ¿");
	p2.setname("±è±â¹ü");

	p1.roll(dice1, dice2);
	p2.roll(dice1, dice2);

	if (p1.getTotal() > p2.getTotal()) {
		cout << p1.getName() << " ´Ô ½Â¸® ==> ";
		cout << p1.getTotal() << " : " << p2.getTotal() << endl;
	}
	else if (p1.getTotal() == p2.getTotal()) {
		cout << "¹«½ÂºÎ" << endl;
		cout << p1.getTotal() << " : " << p2.getTotal() << endl;
	}
	else {
		cout << p2.getName() << " ´Ô ½Â¸® ==> ";
		cout << p1.getTotal() << " : " << p2.getTotal() << endl;
	}



	return 0;
}