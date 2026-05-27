//const int MAX = 10;
template <typename T,int MAX=10>// 선언할때만 default value 값을 저장하기 가능.
class Stack
{
private:
	T items[MAX];
	int top;
public:
	Stack();
	bool isempty() const;
	bool isfull() const;
	bool push(const T& item);
	bool pop(T& item);
};

template <typename T, int MAX> //여기서는 타입 정의하기.
Stack<T, MAX>::Stack() :top(0) { // 여기서는 변수를 인자로 넘기기.

}

template <typename T, int MAX>
bool Stack<T,MAX>::isempty() const {
	return top == 0;
}

template <typename T,int MAX>
bool Stack<T,MAX>::isfull() const {
	return top == MAX;
}



template <typename T,int MAX>
bool Stack<T,MAX>::push(const T& item)
{
	if (top < MAX) {
		items[top++] = item;
		return true;
	}
	else
		return false;
}
template <typename T,int MAX>
bool Stack<T,MAX> ::pop(T& item)
{
	if (top > 0) {
		item = items[--top];
		return true;
	}
	else
		return false;
}