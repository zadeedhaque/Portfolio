---
title: "60 Projects Challenge"
---

*Personal challenge · C++ & Java · complete*

Sixty programs, built in three escalating tiers, to make programming fundamentals second nature. Every project is written twice — once in C++ and once in Java — so the same idea gets expressed in two languages with different rules.

- **60 / 60** Projects finished
- **30** Programs, each built in both languages
- **3** Tiers: fundamentals, OOP, data structures
- **29.8×** Fewer comparisons for merge sort vs bubble at N = 2000

Each pair below is one program in both languages; the numbers are its C++ and Java entries in the repo.

## FundamentalsProjects 01–20

Input and output, conditions, loops, functions, files — the basics, written twice in two languages.

1.  01 · 02
    
    **Calculator**Four arithmetic operations, menu-driven, with a division-by-zero guard. The Java build uses printf formatting and Scanner input.
    
2.  03 · 04
    
    **Number Guessing Game**Guess a random number from 1 to 100, with too-high / too-low feedback and an attempt counter.
    
3.  05 · 06
    
    **Temperature Converter**Celsius, Fahrenheit and Kelvin, converting in any direction.
    
4.  07 · 08
    
    **Unit Converter**Length, weight and volume across metric and imperial.
    
5.  09 · 10
    
    **Multiplication Table Generator**Formatted tables for any number and range.
    
6.  11 · 12
    
    **String Reverser**Reverses any string, whole or word by word.
    
7.  13 · 14
    
    **Palindrome Checker**Ignores case, spaces and punctuation, so whole sentences work.
    
8.  15 · 16
    
    **File Reader**Opens a text file, prints it and counts lines and words — plus characters in the Java build.
    
9.  17 · 18
    
    **File Writer**Writes multi-line text with overwrite, append and view modes.
    
10.  19 · 20
     
     **Grade Calculator**Letter grades, credit-weighted GPA and a pass/fail summary table.
     

## Object-orientedProjects 21–40

Ten systems, each one built around inheritance, abstraction and polymorphism rather than just using them.

1.  21 · 22
    
    **Bank Account System**An abstract Account base; three account types set their own withdrawal rules, interest and fees.
    
2.  23 · 24
    
    **Library System**Four item types with their own loan periods and fine rates; reference books refuse to be borrowed.
    
3.  25 · 26
    
    **Student Management System**A three-level chain — Person → Student → Under/Postgraduate — each level with its own pass mark and unit cap.
    
4.  27 · 28
    
    **Employee Management System**Four pay formulas; bonus, progressive tax and super written once in the base class.
    
5.  29 · 30
    
    **Vehicle Rental System**A mixed fleet sharing one pricing pipeline, built on a rate only the subclass supplies.
    
6.  31 · 32
    
    **Hotel Reservation System**Four room grades: suites include breakfast, family rooms waive the extra-guest fee.
    
7.  33 · 34
    
    **Inventory Management System**Four categories with their own markup; perishables cap intake quantity.
    
8.  35 · 36
    
    **Course Registration System**Enrolment refused on four grounds — full, missing prerequisite, timetable clash, credit limit. Java uses an interface with default methods.
    
9.  37 · 38
    
    **Hospital Management System**A four-level hierarchy with a triage queue ordered by urgency — an overloaded operator< in C++, Comparable in Java.
    
10.  39 · 40
     
     **Expense Tracker**Income, expenses and savings transfers share a base class but differ on sign and budget impact.
     

## Data structuresProjects 41–60

Ten structures and algorithms implemented from scratch, then measured against the language's own library version.

1.  41 · 42
    
    **Dynamic Array**std::vector from scratch on a raw heap buffer — doubling growth, amortised O(1) append. The Java build does the same on an Object\[\], which is what ArrayList does underneath.
    
2.  43 · 44
    
    **Singly Linked List**Raw nodes and pointers; every cost in the table follows from having no way back.
    
3.  45 · 46
    
    **Doubly Linked List**The singly list plus one pointer per node — which fixes its one weakness.
    
4.  47 · 48
    
    **Stack**Built twice, array-backed and node-backed, behind one interface for a direct comparison.
    
5.  49 · 50
    
    **Queue**Built twice: a fixed-capacity circular buffer and unbounded linked nodes.
    
6.  51 · 52
    
    **Binary Search**log₂(N) search, the midpoint overflow bug, and what happens on unsorted input. Java uses >>> for an overflow-safe midpoint.
    
7.  53 · 54
    
    **Bubble Sort**Four variants — naive, shrinking range, early exit, cocktail shaker — measured against each other, plus a stability demonstration in Java.
    
8.  55 · 56
    
    **Merge Sort**Divide and conquer with inversion counting: 29.8× fewer comparisons than bubble sort at N = 2000.
    
9.  57 · 58
    
    **Binary Search Tree**All three delete cases and four traversals, plus the degenerate case — height 100 down to 7 after rebalancing. Cross-checked against TreeMap.
    
10.  59 · 60
     
     **Min Heap**An array-backed complete tree; Floyd's O(N) build measured against N inserts, cross-checked against PriorityQueue.
     

## What it built

Object-oriented design · Data structures · Algorithm analysis · Complexity · File I/O · Two-language fluency

## Languages

C++ · Java
