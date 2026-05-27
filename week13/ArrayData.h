#pragma once
#include <iostream>
#include <string>
using namespace std;

template <typename T>
class ArrayData;

template <typename T>
ostream& operator<<(ostream& out, const ArrayData<T>& arr);

template <typename T>
class ArrayData
{
protected:
    T* data = nullptr;
    int capacity;
    int used;
public:
    ArrayData();
    ArrayData(const int& capacity, const int& used = 0);
    ArrayData(ArrayData& arr); //깊은복사 생성자
    ArrayData(ArrayData&& arr)noexcept; // 이동생성자
    ~ArrayData();
    void addElement(const T& num); //r-value로 add 하기
    bool full() const;
    void emptyArray();
    void showData() const;
    int getCapacity() const {
        return this->capacity;
    };
    int getUsed() const {
        return this->used;
    };
    void setUsed() {
        used++;
    }

    ArrayData<T>& operator=(const ArrayData<T>& rhs); //l-value 를 대입 --> 대입 연산자
    ArrayData<T>& operator=(ArrayData<T>&& rhs) noexcept; // r-value를 대입 --> 이동 대입 연산자

    T& operator[](size_t num); // 일반객체 배열 연산자 
    const T& operator[](size_t num)const; // const 배열 연산자 
    template <typename T>
    friend ostream& operator<<(ostream& out, const ArrayData<T>& arr); // 출력연산자 
};



template <typename T>
ArrayData<T>::ArrayData() :ArrayData(3) {}

template <typename T>
ArrayData<T>::ArrayData(const int& capacity, const int& used) : capacity(capacity), used(used)
{
    cout << "생성자" << endl;
    data = new T[this->capacity];
}

template <typename T>
ArrayData<T>::ArrayData(ArrayData& arr) //복사생성자
    : ArrayData(arr.capacity, arr.used)
{
    cout << "복사 생성자" << endl;
    //   used=arr.used;
    for (int i = 0; i < used; i++) {
        this->data[i] = arr.data[i];
    }
}

template <typename T>
ArrayData<T>::ArrayData(ArrayData&& arr)noexcept
    :capacity(arr.capacity), used(arr.used), data(arr.data) // unique_ptr일때 data참조 안되서 사용 x
    //   :capacity(arr.capacity), used(arr.used), data(std::move(arr.data)) uniqueptr면 move를 통해서 주소를 가져와야한다.
{
    cout << "이동생성자" << endl;
    arr.data = nullptr;    //uniqu_ptr일때 필요 x
}

template <typename T>
ArrayData<T>::~ArrayData()
{   //make_shared 일때 사용 안해도 됨
    if (data != nullptr)
        delete[] data;
    data = nullptr;
}

template <typename T>
void ArrayData<T>::addElement(const T& num)
{
    if (!full())
        data[used++] = num;
    else
        cout << "빈방이 없음\n";
}

template <typename T>
bool ArrayData<T>::full() const
{
    return this->capacity == this->used;
}


template <typename T>
void ArrayData<T>::emptyArray()
{
    this->used = 0;
    // 원래 배열에 있던 것을 왜 안 비워도 되냐면, 
    // used가 0이면 insert를 할때는 0부터 삽입되기때문에, 원래의 값이 덮어씌어진다.
    // 그리고 get으로 접근하면 used값과 비교해서 접근되기때문에, 이전의 이상한 값이 나올 수가 없음
}

template <typename T>
//const -> 값을 변경시키지 않은 함수
void ArrayData<T>::showData() const
{
    for (size_t i = 0; i < used; i++)
        cout << data[i] << " ";
    cout << endl;
}

template <typename T>
ArrayData<T>& ArrayData<T>::operator=(const ArrayData<T>& rhs)
{
    cout << "복사 대입 연산자" << endl;
    if (this == &rhs) return *this;
    capacity = rhs.capacity;
    used = rhs.used;
    delete[] data;
    data = new T[capacity];
    for (int i = 0; i < used; i++)
        data[i] = rhs.data[i];
    return *this;
}

template <typename T>
ArrayData<T>& ArrayData<T>::operator=(ArrayData<T>&& rhs) noexcept
{
    cout << "이동 대입 연산자" << endl;
    if (this == &rhs) return *this;
    capacity = rhs.capacity;
    used = rhs.used;
    delete[] data;
    // 원래의 자신의 동적할당된 공간을 버리고 
    // 대입되는 r-value 의 동적할당된 공간을 가진다.
    data = rhs.data;
    capacity = rhs.capacity;
    used = rhs.used;

    rhs.data = nullptr;
    rhs.capacity = 0;
    rhs.used = 0;
    return *this;
}

template <typename T>
T& ArrayData<T>::operator[](size_t num)
{
    return data[num];
}

template <typename T>
const T& ArrayData<T>::operator[](size_t num) const
{
    return data[num];
}

template <typename T>
ostream& operator<<(ostream& out, const ArrayData<T>& arr)
{
    for (int i = 0; i < arr.used; i++) {
        out << arr.data[i] << " ";
    }
    return out;
}












//#pragma once
//#include <memory>
//#include <iostream>
//#include "CMyPoint.h"
//using namespace std;
//
//template <typename T1>
//class ArrayData
//{
//protected:
//	T1* data=nullptr;
//	//shared_ptr<double[]> data;
//	//unique_ptr<double[]> data;
//	int capacity;
//	int used;
//public:
//	ArrayData();
//	ArrayData(const int& capacity, const int& used = 0);
//	ArrayData(ArrayData& arr);
//	ArrayData(ArrayData&& arr)noexcept;
//	~ArrayData();
//	void addElement(const T1& num);
//	bool full() const;
//	void emptyArray();
//	void showData() const;
//	int getCapacity() const {
//		return this->capacity;
//	};
//	int getUsed() const {
//		return this->used;
//	};
//	void setUsed() {
//		used++;
//	}
//
//	ArrayData<T1>& operator=(const ArrayData<T1>& rhs);
//	ArrayData<T1>& operator=(ArrayData<T1>&& rhs) noexcept;
//
//	T1& operator[](size_t num);
//	const T1& operator[](size_t num)const;
//	friend ostream& operator<<(ostream& out, const ArrayData<T1>& arr);
//
//};
//
//
//
//template <typename T1>
//ArrayData<T1>::ArrayData() :ArrayData(3)
//{
//}
//
//template <typename T1>
//ArrayData<T1>::ArrayData(const int& capacity, const int& used) :capacity(capacity), used(used)
//{
//	cout << "생성자" << endl;
//	data = new T1[this->capacity];
//	//data=make_shared<double[]>(this->capacity);
//	//data = make_unique<double[]>(this->capacity);
//}
//
//template <typename T1>
//ArrayData<T1>::ArrayData(ArrayData<T1>& arr) //복사생성자
//	:ArrayData(arr.capacity, arr.used)
//{
//	cout << "복사 생성자" << endl;
//	//	used=arr.used;
//	for (int i = 0; i < used; i++) {
//		this->data[i] = arr.data[i];
//	}
//}
//template <typename T1>
//ArrayData<T1>::ArrayData(ArrayData<T1>&& arr)noexcept
////	:capacity(arr.capacity), used(arr.used),data(arr.data) unique_ptr일때 data참조 안되서 사용 x
//	:capacity(arr.capacity), used(arr.used), data(std::move(arr.data))
//{
//	cout << "이동생성자" << endl;
//	arr.data=nullptr; 
//}
//
//template <typename T1>
//ArrayData<T1>::~ArrayData()
//{	//make_shared 일때 사용 안해도 됨
//	 if (data != nullptr)
//	 	delete[] data;
//	 data = nullptr;
//}
//
//template <typename T1>
//void ArrayData<T1>::addElement(const T1& num)
//{
//	if (!full())
//		data[used++] = num;
//	else
//		cout << "빈방이 없음\n";
//}
//template <typename T1>
//bool ArrayData<T1>::full() const
//{
//	return this->capacity == this->used;
//}
//
//template <typename T1>
//void ArrayData<T1>::emptyArray()
//{
//	this->used = 0;
//}
//
////const -> 값을 변경시키지 않은 함수
//template <typename T1>
//void ArrayData<T1>::showData() const
//{
//	for (size_t i = 0; i < used; i++)
//		cout << data[i] << " ";
//	cout << endl;
//}
//
//template <typename T1>
//ArrayData<T1>& ArrayData<T1>::operator=(const ArrayData<T1>& rhs)
//{
//	cout << "복사 대입 연산자" << endl;
//	if (this == &rhs) return *this;
//	capacity = rhs.capacity;
//	used = rhs.used;
//	data = new ArrayData<T1[]>(capacity);
//	for (int i = 0; i < used; i++)
//		data[i] = rhs.data[i];
//	return *this;
//}
//
//template <typename T1>
//ArrayData<T1>& ArrayData<T1>::operator=(ArrayData<T1>&& rhs) noexcept
//{
//	cout << "이동 대입 연산자" << endl;
//	if (this == &rhs) return *this;
//	capacity = rhs.capacity;
//	used = rhs.used;
//	data = rhs.data;
//	return *this;
//}
//
//template <typename T1>
//T1& ArrayData<T1>::operator[](size_t num)
//{
//	return data[num];
//}
//
//template <typename T1>
//const T1& ArrayData<T1>::operator[](size_t num) const
//{
//	return data[num];
//}
//
//
//template <typename T1>
//ostream& operator<<(ostream& out, const ArrayData<T1>& arr)
//{
//	for (int i = 0; i < arr.used; i++)
//		out << arr.data[i] << " ";
//	out << endl;
//	return out;
//}
//
//
