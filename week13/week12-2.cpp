#include <iostream>
#include <string>
#include "CMyPoint.h"
#include "ArrayData.h"
#include <memory>
#include <vector>
#include <list>
using namespace std;


template<typename T>
void printArr(T* arr, size_t n) {
	for (int i = 0; i < n; i++) {
		cout << arr[i] << "\t";
	}

	cout << endl;
}

template<typename T>
void printArr(list<T>& v) {
	for (auto it = v.begin(); it != v.end(); it++) {
		cout << *it << " ";
	}
	cout << endl;
}

template<typename T>
void printArr(vector<T>& v) {
	for (auto it = v.begin(); it != v.end(); it++) {
		cout << *it << " ";
	}
	cout << endl;
}

template<>
void printArr(char* arr, size_t n) {
	cout << arr;

	cout << endl;
}
// 특정타입에 대한 스페셜라이징 특수화 함수

template<typename T,size_t N>
//size를 호출할때 내가 임의로 지정해주는 느낌쓰
void showArr(T (& arr)[N]) {

// 배열을 인자로 넘길때, 래퍼런스이기에 반드시 해당 배열의 크기가 정해져있어야함.
// -> 내가 몇개짜리 방인지에 대한 정보가 있어야함.

	for (auto i : arr) {//auto 로 arr의 type 을 가져와서 사용할 수 있음.
		cout << i <<"\t";
	}

	cout << endl;

}

template<typename T, size_t N>
void sortAsc(T(&arr)[N]) {
	for (int i = 0; i < N; i++) {
		for (int j = i; j < N; j++) {
			if (arr[j] < arr[i]) {
				T tmp = arr[i];
				arr[i] = arr[j];
				arr[j] = tmp;
			}
		}
	}
}



int main() {

	list<string> std1({ "greenjoa1","greenjoa2","greenjoa3" });

	list<string> std2({ "bluejoa1","bluejoa2" });

	list<string> std3({ "redjoa1"});

	//2차원 배열인것처럼

	//2차원 배열이지만 각 층의 길이가 다른

	vector<list<string>> lsvector;

	// 컨테이너 안에 컨테이너가 들어갈 수 있음.

	lsvector.push_back(std1);

	lsvector.push_back(std2);

	lsvector.push_back(std3);

	vector<string> vecs;

	for (auto x : lsvector) {
		for (auto y : x) {
			vecs.push_back(y);
		}
	}

	//2차원 배열을 1차원으로 매우 길게 만들기

	//list<CMyPoint> list2;
	//list2.push_back(CMyPoint(10,10));//객체를 생성하고 list 로 이동시키고 
	//list2.emplace_back(10,10);  //list에 바로 생성하고
	//list2.emplace_front(10, 10); //list에 바로 생성하고
	//list2.push_front(CMyPoint(10,10));// 객체를 생성하고 list로 이동시키고 기존 객체 소멸하고
	//list2.emplace_back(20, 30);
	//list2.unique();
	////unique를 통해서 똑같은 것을 제거시키려면 equal 연산자 == 를 내가 만든 타입을 오버라이딩 시켜서 똑같다는 기준을 정의해줘야하는거임

	//printArr(list2);


	//list<CMyPoint> list3;
	//list3.push_back(CMyPoint(40, 40));
	//list3.push_back(CMyPoint(50, 50));

	//list2.splice(list2.end(), list3);
	////주의해야할 점은 빼내는 list는 비어진다.
	//printArr(list2);

	//cout << list3.size() << endl;
	
	
	//list<int> list1({ 1,2,3,3,3,4,5 });
	//list1.unique();
	//printArr(list1);

	/*ArrayData<int> y;
	y.addElement(12);
	y.addElement(34);
	cout << y << endl;

	ArrayData<string> x;
	x.addElement("가나다");
	x.addElement("마바사");
	cout << x << endl;

	ArrayData<CMyPoint> arr;
	arr.addElement(CMyPoint(10, 50));
	arr.addElement(CMyPoint(20, 60));
	cout << arr << endl;*/


	//Stack<int> istack;

	//istack.push(10);
	//istack.push(20);
	//istack.push(30);
	//istack.push(40);
	//istack.push(50);
	//int iItem;
	//while (istack.pop(iItem)) {
	//	cout << iItem << endl;
	//}


	//Stack<CMyPoint> cmstack;
	//cmstack.push(CMyPoint(10, 60));
	//cmstack.push(CMyPoint(20, 70));
	//cmstack.push(CMyPoint(30, 80));
	//cmstack.push(CMyPoint(40, 90));
	//cmstack.push(CMyPoint(50, 10));

	//CMyPoint k;
	//while (cmstack.pop(k)) { // pop할때 쓰는 Stack타입이랑 인자로 넣는 타입이랑 같아야한다잉
	//	cout << k << endl;
	//}

	//int intArr[]{ 1,2,3,4,5 };
	//double doubleArr[]{ 2.2,3.5,4.5 };
	//string strArr[]{ "green1","green2" ,"green3"};

	//char charArr[]{ 'a','b','c',0 }; // 0 은 null 문자 의미
	//
	//CMyPoint pointArr[]{ CMyPoint(5,3),CMyPoint(8,9),CMyPoint(4,6) };

	//showArr(pointArr);
	//printArr(intArr, size(intArr));
	//printArr(doubleArr, size(doubleArr));
	//printArr(strArr, size(strArr));
	//printArr(charArr, size(charArr));

	//showArr(intArr);
	//showArr(doubleArr);
	//showArr(strArr);
	//showArr(charArr);

	//CMyPoint arr[]{ CMyPoint(20,30),CMyPoint(10,20),CMyPoint(40,50) };

	//sortAsc(arr);
	//showArr(arr);
	/*cout << intArr<<endl;
	
	cout << doubleArr << endl;

	cout << charArr << endl;*/

	return 0;
}