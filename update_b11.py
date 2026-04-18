import json

f = 'C:/Dev/devlearner/devlearner/learning-system/src/main/resources/seeds/B11-class-and-object.json'
with open(f, encoding='utf-8') as fh:
    data = json.load(fh)

improvements = {
    1: {
        "description": "Design a `Student` class with fields `String name`, `int age`, `double gpa`. Add a constructor, getters, and a `toString()` that returns `\"Student{name='Alice', age=20, gpa=3.8}\"`.\n\n**Example 1:**\nStudent s = new Student(\"Alice\", 20, 3.8);\ns.toString() => \"Student{name='Alice', age=20, gpa=3.8}\"\n\n**Example 2:**\nStudent s = new Student(\"Bob\", 22, 3.2);\ns.getName() => \"Bob\"\ns.getAge() => 22\ns.getGpa() => 3.2",
        "sampleInput": "new Student(\"Alice\", 20, 3.8)",
        "sampleOutput": "\"Student{name='Alice', age=20, gpa=3.8}\""
    },
    2: {
        "description": "Create a `Widget` class where each instance is automatically assigned a unique sequential `id` starting from 1. Use a `static int counter` field incremented in the constructor.\n\n**Example:**\nWidget w1 = new Widget(\"button\");\nWidget w2 = new Widget(\"label\");\nWidget w3 = new Widget(\"panel\");\nw1.getId() => 1\nw2.getId() => 2\nw3.getId() => 3\n\n**Key insight:** `static` fields are shared across all instances — incrementing it in each constructor produces unique per-instance IDs.",
        "sampleInput": "new Widget(\"button\"), new Widget(\"label\"), new Widget(\"panel\")",
        "sampleOutput": "ids = [1, 2, 3]"
    },
    3: {
        "description": "Create a `Point` class with `int x, y`. Override `equals()` so two Points with the same coordinates are equal, and override `hashCode()` consistently.\n\n**Example 1:**\nnew Point(3,4).equals(new Point(3,4)) => true\nnew Point(3,4).equals(new Point(3,5)) => false\n\n**Example 2:**\nSet<Point> set = new HashSet<>();\nset.add(new Point(1,2));\nset.contains(new Point(1,2)) => true\n\n**Key insight:** If you override `equals()`, you MUST override `hashCode()` — otherwise `HashSet`/`HashMap` will treat equal objects as different keys.",
        "sampleInput": "new Point(3,4).equals(new Point(3,4))",
        "sampleOutput": "true"
    },
    4: {
        "description": "Implement a `PersonBuilder` that builds a `Person(name, age, email)` using **method chaining**. Each setter returns `this`, so calls can be chained. `build()` returns the final `Person`.\n\n**Example:**\nPerson p = new PersonBuilder()\n    .name(\"Alice\")\n    .age(30)\n    .email(\"alice@example.com\")\n    .build();\np.getName() => \"Alice\"\np.getAge() => 30\n\n**Key insight:** Each method returns `this` (the builder), enabling fluent dot-chaining. `build()` constructs the final immutable object.",
        "sampleInput": "new PersonBuilder().name(\"Alice\").age(30).email(\"alice@example.com\").build()",
        "sampleOutput": "Person{name='Alice', age=30, email='alice@example.com'}"
    },
    5: {
        "description": "Create a `Transaction` class with fields `String id`, `String type`, `double amount`, `java.time.LocalDate date`. Override `toString()` to return a human-readable summary.\n\n**Example 1:**\nnew Transaction(\"T001\", \"CREDIT\", 250.0, LocalDate.of(2024,1,15)).toString()\n=> \"Transaction[T001] CREDIT $250.00 on 2024-01-15\"\n\n**Example 2:**\nnew Transaction(\"T002\", \"DEBIT\", 75.5, LocalDate.of(2024,2,1)).toString()\n=> \"Transaction[T002] DEBIT $75.50 on 2024-02-01\"",
        "sampleInput": "new Transaction(\"T001\", \"CREDIT\", 250.0, LocalDate.of(2024,1,15))",
        "sampleOutput": "\"Transaction[T001] CREDIT $250.00 on 2024-01-15\""
    },
    6: {
        "description": "Create a `Circle` class with **three constructors** using `this()` chaining:\n- `Circle()` — defaults: radius=1.0, color=\"red\"\n- `Circle(double radius)` — default color=\"red\"\n- `Circle(double radius, String color)`\n\n**Example 1:**\nnew Circle().getRadius() => 1.0, getColor() => \"red\"\n\n**Example 2:**\nnew Circle(5.0).getRadius() => 5.0, getColor() => \"red\"\n\n**Example 3:**\nnew Circle(3.0, \"blue\").getArea() => 28.27\n\n**Key insight:** `this(args)` calls another constructor in the same class — avoids duplicating initialization logic.",
        "sampleInput": "new Circle(3.0, \"blue\").getArea()",
        "sampleOutput": "28.27"
    },
    7: {
        "description": "Create `Product(String name, double price, int quantity)`. Implement `Inventory` with `addProduct()`, `getTotalValue()` (sum of price*qty), and `getMostExpensive()` (highest unit price).\n\n**Example:**\nInventory inv = new Inventory();\ninv.addProduct(new Product(\"Apple\", 0.5, 100));\ninv.addProduct(new Product(\"Laptop\", 999.99, 5));\ninv.getTotalValue() => 5049.95\ninv.getMostExpensive().getName() => \"Laptop\"",
        "sampleInput": "products: Apple($0.50 x100), Laptop($999.99 x5)",
        "sampleOutput": "totalValue=5049.95, mostExpensive=\"Laptop\""
    },
    8: {
        "description": "Create both `MutablePoint` (fields changeable via setters) and `ImmutablePoint` (all fields final, no setters, `withX(int x)` returns a new instance).\n\n**MutablePoint example:**\nMutablePoint p = new MutablePoint(1,2);\np.setX(10);\np.getX() => 10\n\n**ImmutablePoint example:**\nImmutablePoint p = new ImmutablePoint(1,2);\nImmutablePoint p2 = p.withX(10);\np.getX() => 1   // original unchanged\np2.getX() => 10  // new instance\n\n**Key insight:** Immutable objects are thread-safe by design — no synchronization needed since state never changes.",
        "sampleInput": "ImmutablePoint(1,2).withX(10)",
        "sampleOutput": "original.x=1, new.x=10"
    },
    9: {
        "description": "Design a `Temperature` class storing Celsius internally. Add factory methods `fromCelsius(double)`, `fromFahrenheit(double)`, `fromKelvin(double)`, and conversion getters `toCelsius()`, `toFahrenheit()`, `toKelvin()`.\n\n**Example 1:**\nTemperature.fromFahrenheit(212).toCelsius() => 100.0\n\n**Example 2:**\nTemperature.fromKelvin(273.15).toCelsius() => 0.0\n\n**Example 3:**\nTemperature.fromCelsius(0).toFahrenheit() => 32.0\n\n**Key insight:** Factory methods communicate intent better than constructors — `fromFahrenheit(212)` is clearer than `new Temperature(100)`.",
        "sampleInput": "Temperature.fromFahrenheit(212).toCelsius()",
        "sampleOutput": "100.0"
    },
    10: {
        "description": "Create `Student(String name, double gpa)` implementing `Comparable<Student>` — compare by GPA descending (highest first). Also write a `Comparator` for alphabetical name order.\n\n**Example:**\nList<Student> students = List.of(\n    new Student(\"Charlie\", 3.5),\n    new Student(\"Alice\", 3.9),\n    new Student(\"Bob\", 3.7));\nCollections.sort(students);\n// => [Alice(3.9), Bob(3.7), Charlie(3.5)]\n\n**Key insight:** `compareTo` defines natural order. `Comparator` defines alternate orderings. Both are used by `Collections.sort()` and `TreeSet`.",
        "sampleInput": "[Charlie(3.5), Alice(3.9), Bob(3.7)] sorted by GPA desc",
        "sampleOutput": "[Alice(3.9), Bob(3.7), Charlie(3.5)]"
    },
    11: {
        "description": "Create `BankAccount(String owner, double initialBalance)`. The constructor must throw `IllegalArgumentException` if `owner` is blank or `initialBalance < 0`. `deposit(double)` and `withdraw(double)` must also validate inputs.\n\n**Example 1:**\nnew BankAccount(\"Alice\", 100.0).getBalance() => 100.0\n\n**Example 2:**\nnew BankAccount(\"\", 100.0) => throws IllegalArgumentException(\"Owner must not be blank\")\n\n**Example 3:**\nnew BankAccount(\"Bob\", -50) => throws IllegalArgumentException(\"Balance cannot be negative\")",
        "sampleInput": "new BankAccount(\"\", 100.0)",
        "sampleOutput": "throws IllegalArgumentException"
    },
    12: {
        "description": "Model an `Order` containing a list of `LineItem(String product, int qty, double unitPrice)`. Implement `Order.getTotal()` summing `qty * unitPrice` for all line items, and `Order.toString()` listing each item.\n\n**Example:**\nOrder order = new Order(\"O-001\");\norder.addItem(new LineItem(\"Apple\", 3, 0.50));\norder.addItem(new LineItem(\"Milk\", 2, 1.20));\norder.getTotal() => 3.90\norder.getItemCount() => 2\n\n**Key insight:** Composition — Order HAS-A list of LineItems. Each object has a single responsibility.",
        "sampleInput": "Order with LineItem(Apple,3,$0.50) and LineItem(Milk,2,$1.20)",
        "sampleOutput": "total = 3.90"
    },
    13: {
        "description": "Implement a **thread-safe Singleton** `DatabaseConfig` using the initialization-on-demand holder idiom. `getInstance()` must return the same instance every time, even under concurrent access.\n\n**Example:**\nDatabaseConfig a = DatabaseConfig.getInstance();\nDatabaseConfig b = DatabaseConfig.getInstance();\na == b => true\n\n**Key insight:** The holder idiom — a private static inner class `Holder { static final DatabaseConfig INSTANCE = new DatabaseConfig(); }` — is initialized lazily and is inherently thread-safe due to class-loading guarantees.",
        "sampleInput": "DatabaseConfig.getInstance() called twice",
        "sampleOutput": "same instance: a == b => true"
    },
    14: {
        "description": "Create an immutable `DateRange(Date start, Date end)` class. Since `java.util.Date` is mutable, the constructor must make **defensive copies**, and getters must return copies too — otherwise callers could mutate the \"immutable\" object.\n\n**Example:**\nDate s = new Date(1000L);\nDateRange r = new DateRange(s, new Date(2000L));\ns.setTime(9999L);          // mutate original\nr.getStart().getTime() => 1000L  // defensive copy protects immutability\n\n**Key insight:** `new Date(original.getTime())` in the constructor and getter prevents external mutation of internal state.",
        "sampleInput": "DateRange constructed, then source Date mutated",
        "sampleOutput": "r.getStart().getTime() = 1000L (unchanged)"
    },
    15: {
        "description": "Implement `UserBuilder` with fields `username`, `email`, `age`. `build()` must validate: username non-null/non-blank, email contains '@', age between 0–150. Throw `IllegalStateException` with a descriptive message on violation.\n\n**Example 1:**\nnew UserBuilder().username(\"alice\").email(\"alice@example.com\").age(25).build()\n=> User{username='alice', email='alice@example.com', age=25}\n\n**Example 2:**\nnew UserBuilder().username(\"bob\").email(\"not-an-email\").age(25).build()\n=> throws IllegalStateException(\"Invalid email\")",
        "sampleInput": "username=\"bob\", email=\"not-an-email\", age=25",
        "sampleOutput": "throws IllegalStateException(\"Invalid email\")"
    },
    16: {
        "description": "Implement a generic `Pair<A, B>` class with fields `first` and `second`, a full constructor, getters, `equals()`, `hashCode()`, `toString()`, and a static factory method `of(A a, B b)`.\n\n**Example 1:**\nPair<String, Integer> p = Pair.of(\"hello\", 42);\np.getFirst() => \"hello\"\np.getSecond() => 42\np.toString() => \"(hello, 42)\"\n\n**Example 2:**\nPair.of(\"a\", 1).equals(Pair.of(\"a\", 1)) => true\n\n**Key insight:** Generic classes let you write type-safe containers without casting. `Pair<String,Integer>` is checked at compile time.",
        "sampleInput": "Pair.of(\"hello\", 42)",
        "sampleOutput": "\"(hello, 42)\""
    },
    17: {
        "description": "Create a `StringPipeline` class wrapping a String with chainable transformation methods: `trim()`, `toUpperCase()`, `replace(from, to)`, `append(s)`. Each returns `this` for chaining. `result()` returns the final string.\n\n**Example:**\nnew StringPipeline(\"  hello world  \")\n    .trim()\n    .toUpperCase()\n    .replace(\"WORLD\", \"JAVA\")\n    .append(\"!\")\n    .result()\n=> \"HELLO JAVA!\"\n\n**Key insight:** Each method mutates internal state and returns `this` — the pipeline pattern for readable sequential transformations.",
        "sampleInput": "\"  hello world  \" -> trim -> toUpperCase -> replace(WORLD,JAVA) -> append(!)",
        "sampleOutput": "\"HELLO JAVA!\""
    },
    18: {
        "description": "Create `Key(int id)` overriding `equals()` but **NOT** `hashCode()`. Demonstrate the bug: two logically-equal Keys placed in a `HashMap` produce two entries instead of one.\n\n**Example (broken):**\nMap<Key,String> map = new HashMap<>();\nmap.put(new Key(1), \"first\");\nmap.put(new Key(1), \"second\");\nmap.size() => 2  // BUG: should be 1\n\n**Fixed (with hashCode):**\nmap.size() => 1\n\n**Key insight:** `HashMap` uses `hashCode()` to find the bucket first, then `equals()` to match within it. Without a consistent `hashCode()`, equal objects land in different buckets.",
        "sampleInput": "put Key(1)->\"first\", put Key(1)->\"second\" (no hashCode override)",
        "sampleOutput": "map.size() = 2 (bug)"
    },
    19: {
        "description": "Implement an immutable `Money(long cents, String currency)` value object. Override `equals()`, `hashCode()`, `toString()`, and add `add(Money other)` (must have same currency) and `multiply(int factor)`.\n\n**Example 1:**\nnew Money(1000, \"USD\").toString() => \"$10.00 USD\"\n\n**Example 2:**\nnew Money(500, \"USD\").add(new Money(300, \"USD\")) => Money(800, \"USD\")\n\n**Example 3:**\nnew Money(200, \"USD\").add(new Money(100, \"EUR\")) => throws IllegalArgumentException(\"Currency mismatch\")",
        "sampleInput": "Money(500,\"USD\").add(Money(300,\"USD\"))",
        "sampleOutput": "Money(800, \"USD\")"
    },
    20: {
        "description": "Implement the **Prototype pattern**: a `Shape` interface with `clone()` method, implemented by `Circle(double radius)` and `Rectangle(double width, double height)`. `clone()` must return a deep copy.\n\n**Example:**\nCircle c1 = new Circle(5.0);\nCircle c2 = (Circle) c1.clone();\nc2.setRadius(10.0);\nc1.getRadius() => 5.0   // original unchanged\nc2.getRadius() => 10.0\n\n**Key insight:** Prototype avoids expensive re-initialization — clone an existing object instead of constructing from scratch. Deep copy ensures independence.",
        "sampleInput": "c1 = Circle(5.0), c2 = c1.clone(), c2.setRadius(10.0)",
        "sampleOutput": "c1.radius=5.0, c2.radius=10.0"
    },
}

updated = 0
for topic in data['topics']:
    for p in topic.get('problems', []):
        order = p['displayOrder']
        if order in improvements:
            imp = improvements[order]
            p['description'] = imp['description']
            p['sampleInput'] = imp['sampleInput']
            p['sampleOutput'] = imp['sampleOutput']
            updated += 1

with open(f, 'w', encoding='utf-8') as fh:
    json.dump(data, fh, indent=2, ensure_ascii=False)
print(f"B11 updated: {updated} problems improved")
