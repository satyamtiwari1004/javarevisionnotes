import RevisionNotesLayout from './components/RevisionNotesLayout';


const SECTIONS = [
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Arrays",
    icon: "▦",
    color: "#06B6D4",
    desc: "Fixed-size, index-based, O(1) access. Foundation of most DSA problems.",
    topics: [
      {
        n: "Array basics & built-in operations",
        complexity: { time: "Access O(1), Search O(n), Insert/Delete O(n)", space: "O(n)" },
        desc: "Arrays store elements in contiguous memory. Java provides Arrays utility class for sorting, searching, copying and filling. Multidimensional arrays are arrays of arrays.",
        code: `// ── Declaration & initialisation ──────────────────────────
int[]    arr  = new int[5];                  // [0,0,0,0,0]
int[]    arr2 = {3, 1, 4, 1, 5, 9, 2, 6};
String[] strs = new String[]{"a","b","c"};

int[][] matrix = new int[3][4];              // 3 rows, 4 cols
int[][] mat2   = {{1,2},{3,4},{5,6}};

// ── Access & mutation ─────────────────────────────────────
arr2[0] = 10;                    // O(1) write
int val = arr2[3];               // O(1) read
int len = arr2.length;           // 8

// ── Arrays utility ────────────────────────────────────────
Arrays.sort(arr2);               // O(n log n)  [1,1,2,3,4,5,6,9]
Arrays.sort(arr2, 2, 6);         // sort subarray [2..6)
Arrays.sort(arr2, Comparator.reverseOrder()); // needs Integer[]

int idx = Arrays.binarySearch(arr2, 4);  // O(log n) — array must be sorted

int[]  copy   = Arrays.copyOf(arr2, arr2.length);     // full copy
int[]  sub    = Arrays.copyOfRange(arr2, 1, 4);        // [1..4)
Arrays.fill(arr, 7);                                    // fill with value
Arrays.fill(arr2, 2, 5, 0);                            // fill range

boolean eq = Arrays.equals(arr, copy);
String  s  = Arrays.toString(arr2);           // "[1, 1, 2, 3, 4, 5, 6, 9]"
String  s2 = Arrays.deepToString(mat2);       // "[[1, 2], [3, 4], [5, 6]]"

// ── Common patterns ───────────────────────────────────────
// Two-pointer
int lo = 0, hi = arr2.length - 1;
while (lo < hi) { /* process arr2[lo] and arr2[hi] */ lo++; hi--; }

// Prefix sum
int[] prefix = new int[arr2.length + 1];
for (int i = 0; i < arr2.length; i++) prefix[i+1] = prefix[i] + arr2[i];
int rangeSum = prefix[5] - prefix[2];  // sum of arr2[2..4]

// Sliding window
int windowSum = 0, k = 3;
for (int i = 0; i < k; i++) windowSum += arr2[i];
int maxSum = windowSum;
for (int i = k; i < arr2.length; i++) {
    windowSum += arr2[i] - arr2[i - k];
    maxSum = Math.max(maxSum, windowSum);
}`
      },
      {
        n: "Two Pointers & Sliding Window",
        complexity: { time: "O(n)", space: "O(1)" },
        desc: "Two pointers reduce O(n²) brute force to O(n) by maintaining two indices that move toward each other or in the same direction. Sliding window maintains a range [left, right] expanding and shrinking to find an optimal subarray.",
        code: `// ── Two Pointers: pair sum in sorted array ────────────────
public int[] twoSum(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        int sum = nums[lo] + nums[hi];
        if (sum == target) return new int[]{lo, hi};
        else if (sum < target) lo++;
        else hi--;
    }
    return new int[]{};
}

// ── Two Pointers: remove duplicates from sorted array ─────
public int removeDuplicates(int[] nums) {
    if (nums.length == 0) return 0;
    int slow = 0;
    for (int fast = 1; fast < nums.length; fast++) {
        if (nums[fast] != nums[slow]) {
            nums[++slow] = nums[fast];
        }
    }
    return slow + 1;
}

// ── Two Pointers: merge two sorted arrays into one ────────
public int[] mergeSorted(int[] a, int[] b) {
    int[] res = new int[a.length + b.length];
    int i = 0, j = 0, k = 0;
    while (i < a.length && j < b.length)
        res[k++] = a[i] <= b[j] ? a[i++] : b[j++];
    while (i < a.length) res[k++] = a[i++];
    while (j < b.length) res[k++] = b[j++];
    return res;
}

// ── Sliding Window: longest substring without repeating ───
public int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> last = new HashMap<>();
    int maxLen = 0;
    for (int left = 0, right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        if (last.containsKey(c) && last.get(c) >= left)
            left = last.get(c) + 1;     // shrink window
        last.put(c, right);
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}

// ── Sliding Window: minimum subarray sum ≥ target ────────
public int minSubArrayLen(int target, int[] nums) {
    int min = Integer.MAX_VALUE, sum = 0, left = 0;
    for (int right = 0; right < nums.length; right++) {
        sum += nums[right];
        while (sum >= target) {
            min = Math.min(min, right - left + 1);
            sum -= nums[left++];
        }
    }
    return min == Integer.MAX_VALUE ? 0 : min;
}`
      },
      {
        n: "Kadane's, Dutch National Flag, Rotation",
        complexity: { time: "O(n)", space: "O(1)" },
        desc: "Classic array algorithms every interview demands. Kadane's finds maximum subarray sum in O(n). Dutch National Flag sorts 0s/1s/2s in one pass. Rotation shifts elements cyclically without extra space.",
        code: `// ── Kadane's Algorithm — max subarray sum ────────────────
public int maxSubArray(int[] nums) {
    int maxSum = nums[0], curSum = nums[0];
    for (int i = 1; i < nums.length; i++) {
        curSum = Math.max(nums[i], curSum + nums[i]); // extend or restart
        maxSum = Math.max(maxSum, curSum);
    }
    return maxSum;
}
// Return subarray indices too:
// track startTemp, start, end; reset startTemp when curSum < nums[i]

// ── Dutch National Flag — sort 0s, 1s, 2s in one pass ───
public void sortColors(int[] nums) {
    int low = 0, mid = 0, high = nums.length - 1;
    while (mid <= high) {
        if      (nums[mid] == 0) swap(nums, low++, mid++);
        else if (nums[mid] == 1) mid++;
        else                     swap(nums, mid, high--);
    }
}
private void swap(int[] a, int i, int j) { int t=a[i]; a[i]=a[j]; a[j]=t; }

// ── Rotate array right by k steps ─────────────────────────
public void rotate(int[] nums, int k) {
    k %= nums.length;
    reverse(nums, 0, nums.length - 1);
    reverse(nums, 0, k - 1);
    reverse(nums, k, nums.length - 1);
}
private void reverse(int[] a, int l, int r) {
    while (l < r) { int t=a[l]; a[l]=a[r]; a[r]=t; l++; r--; }
}

// ── Product of array except self (no division) ───────────
public int[] productExceptSelf(int[] nums) {
    int n = nums.length;
    int[] res = new int[n];
    res[0] = 1;
    for (int i = 1; i < n; i++)       res[i] = res[i-1] * nums[i-1]; // left products
    int right = 1;
    for (int i = n-1; i >= 0; i--) { res[i] *= right; right *= nums[i]; } // * right products
    return res;
}

// ── Next permutation ──────────────────────────────────────
public void nextPermutation(int[] nums) {
    int i = nums.length - 2;
    while (i >= 0 && nums[i] >= nums[i+1]) i--;  // find first dip
    if (i >= 0) {
        int j = nums.length - 1;
        while (nums[j] <= nums[i]) j--;           // find next greater
        swap(nums, i, j);
    }
    reverse(nums, i + 1, nums.length - 1);        // reverse suffix
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Linked List",
    icon: "⬡",
    color: "#F59E0B",
    desc: "Dynamic size, O(1) insert/delete at head, O(n) access. Singly, doubly, and circular variants.",
    topics: [
      {
        n: "Node structure, traversal & basic operations",
        complexity: { time: "Insert head O(1), Insert tail O(n), Search O(n)", space: "O(n)" },
        desc: "Linked list nodes hold a value and a pointer to the next node. Java's LinkedList implements both List and Deque. Hand-rolling a linked list is essential for interview problems.",
        code: `// ── Node definition ───────────────────────────────────────
class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}

// ── Build a list: 1 → 2 → 3 → 4 → null ──────────────────
ListNode head = new ListNode(1);
head.next = new ListNode(2);
head.next.next = new ListNode(3);

// ── Traversal ─────────────────────────────────────────────
ListNode cur = head;
while (cur != null) {
    System.out.print(cur.val + " → ");
    cur = cur.next;
}

// ── Insert at head (O(1)) ─────────────────────────────────
ListNode newHead = new ListNode(0);
newHead.next = head;
head = newHead;

// ── Insert at tail (O(n)) ─────────────────────────────────
ListNode tail = head;
while (tail.next != null) tail = tail.next;
tail.next = new ListNode(5);

// ── Insert after a node ───────────────────────────────────
void insertAfter(ListNode node, int val) {
    ListNode newNode = new ListNode(val);
    newNode.next = node.next;
    node.next = newNode;
}

// ── Delete a node by value ────────────────────────────────
ListNode deleteNode(ListNode head, int val) {
    ListNode dummy = new ListNode(0);
    dummy.next = head;
    ListNode prev = dummy;
    while (prev.next != null) {
        if (prev.next.val == val) { prev.next = prev.next.next; break; }
        prev = prev.next;
    }
    return dummy.next;
}

// ── Find length ───────────────────────────────────────────
int length(ListNode head) {
    int len = 0;
    while (head != null) { len++; head = head.next; }
    return len;
}`
      },
      {
        n: "Reverse, cycle detection, merge, find middle",
        complexity: { time: "O(n)", space: "O(1) for all below" },
        desc: "Core linked list interview patterns: reversing iteratively/recursively, Floyd's cycle detection (fast/slow pointers), merging two sorted lists, and finding the middle node.",
        code: `// ── Reverse linked list (iterative) ─────────────────────
ListNode reverseList(ListNode head) {
    ListNode prev = null, cur = head;
    while (cur != null) {
        ListNode next = cur.next;
        cur.next = prev;
        prev = cur;
        cur = next;
    }
    return prev;
}

// ── Reverse linked list (recursive) ──────────────────────
ListNode reverseRecursive(ListNode head) {
    if (head == null || head.next == null) return head;
    ListNode newHead = reverseRecursive(head.next);
    head.next.next = head;
    head.next = null;
    return newHead;
}

// ── Floyd's cycle detection ───────────────────────────────
boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;
    }
    return false;
}

// ── Find cycle entry point ────────────────────────────────
ListNode detectCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next; fast = fast.next.next;
        if (slow == fast) {
            slow = head;
            while (slow != fast) { slow = slow.next; fast = fast.next; }
            return slow;  // cycle start
        }
    }
    return null;
}

// ── Find middle node (slow/fast pointer) ─────────────────
ListNode middleNode(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;  // for even length: returns second middle
}

// ── Merge two sorted lists ────────────────────────────────
ListNode mergeTwoLists(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(0), cur = dummy;
    while (l1 != null && l2 != null) {
        if (l1.val <= l2.val) { cur.next = l1; l1 = l1.next; }
        else                  { cur.next = l2; l2 = l2.next; }
        cur = cur.next;
    }
    cur.next = (l1 != null) ? l1 : l2;
    return dummy.next;
}

// ── Remove Nth node from end ──────────────────────────────
ListNode removeNthFromEnd(ListNode head, int n) {
    ListNode dummy = new ListNode(0);
    dummy.next = head;
    ListNode fast = dummy, slow = dummy;
    for (int i = 0; i <= n; i++) fast = fast.next;
    while (fast != null) { fast = fast.next; slow = slow.next; }
    slow.next = slow.next.next;
    return dummy.next;
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Stack & Queue",
    icon: "⊟",
    color: "#EF4444",
    desc: "Stack: LIFO — last in first out. Queue: FIFO — first in first out. Both O(1) for core operations.",
    topics: [
      {
        n: "Stack — Java API, monotonic stack, problems",
        complexity: { time: "Push/Pop/Peek O(1)", space: "O(n)" },
        desc: "Java's Stack extends Vector (legacy). Prefer Deque as a stack (ArrayDeque is fastest). Monotonic stack maintains a strictly increasing or decreasing order — key pattern for next greater element, largest rectangle, and trapping rain water problems.",
        code: `// ── Java Stack API ────────────────────────────────────────
Deque<Integer> stack = new ArrayDeque<>();   // preferred
stack.push(1);   stack.push(2);  stack.push(3);
int top  = stack.peek();          // 3 — view without remove
int popped = stack.pop();         // 3 — remove and return
boolean empty = stack.isEmpty();
int size = stack.size();

// ── Valid parentheses ─────────────────────────────────────
boolean isValid(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        if (c=='(' || c=='{' || c=='[') { stack.push(c); }
        else {
            if (stack.isEmpty()) return false;
            char top = stack.pop();
            if (c==')' && top!='(') return false;
            if (c=='}' && top!='{') return false;
            if (c==']' && top!='[') return false;
        }
    }
    return stack.isEmpty();
}

// ── Monotonic Stack: Next Greater Element ─────────────────
// For each element, find the next element to its right that is greater
int[] nextGreaterElement(int[] nums) {
    int n = nums.length;
    int[] res = new int[n];
    Arrays.fill(res, -1);
    Deque<Integer> stack = new ArrayDeque<>(); // stores indices
    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {
            res[stack.pop()] = nums[i];    // nums[i] is the next greater
        }
        stack.push(i);
    }
    return res;
}

// ── Largest Rectangle in Histogram ───────────────────────
int largestRectangleArea(int[] heights) {
    Deque<Integer> stack = new ArrayDeque<>();
    int maxArea = 0, n = heights.length;
    for (int i = 0; i <= n; i++) {
        int h = (i == n) ? 0 : heights[i];
        while (!stack.isEmpty() && heights[stack.peek()] > h) {
            int height = heights[stack.pop()];
            int width  = stack.isEmpty() ? i : i - stack.peek() - 1;
            maxArea = Math.max(maxArea, height * width);
        }
        stack.push(i);
    }
    return maxArea;
}

// ── Trapping Rain Water ───────────────────────────────────
int trap(int[] height) {
    Deque<Integer> stack = new ArrayDeque<>();
    int water = 0;
    for (int i = 0; i < height.length; i++) {
        while (!stack.isEmpty() && height[i] > height[stack.peek()]) {
            int bottom = stack.pop();
            if (stack.isEmpty()) break;
            int left = stack.peek();
            int boundedHeight = Math.min(height[left], height[i]) - height[bottom];
            water += boundedHeight * (i - left - 1);
        }
        stack.push(i);
    }
    return water;
}`
      },
      {
        n: "Queue, Deque & Monotonic Queue",
        complexity: { time: "Offer/Poll/Peek O(1)", space: "O(n)" },
        desc: "Queue is FIFO. Deque (double-ended queue) supports O(1) add/remove from both ends — use as stack or queue. PriorityQueue provides O(log n) poll of min/max. Monotonic deque is key for sliding window maximum problems.",
        code: `// ── Queue API (LinkedList as Queue) ──────────────────────
Queue<Integer> q = new LinkedList<>();
q.offer(1); q.offer(2); q.offer(3);
int front = q.peek();    // 1 — view front
int out   = q.poll();    // 1 — remove front
boolean empty = q.isEmpty();

// ── Deque API (ArrayDeque — fastest) ─────────────────────
Deque<Integer> dq = new ArrayDeque<>();
dq.addFirst(1);  dq.addLast(2);   // both ends
dq.offerFirst(0); dq.offerLast(3);
int front2 = dq.peekFirst();   // 0
int back   = dq.peekLast();    // 3
dq.pollFirst();  dq.pollLast();

// ── PriorityQueue (Min-Heap by default) ───────────────────
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());

minHeap.offer(5); minHeap.offer(1); minHeap.offer(3);
int min = minHeap.poll();   // 1 — always removes minimum

// Custom comparator
PriorityQueue<int[]> pq = new PriorityQueue<>((a,b) -> a[0]-b[0]); // sort by first element

// ── BFS with Queue ────────────────────────────────────────
void bfs(int start, List<List<Integer>> adj, int n) {
    boolean[] visited = new boolean[n];
    Queue<Integer> q2 = new LinkedList<>();
    q2.offer(start);
    visited[start] = true;
    while (!q2.isEmpty()) {
        int node = q2.poll();
        System.out.print(node + " ");
        for (int neighbor : adj.get(node)) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                q2.offer(neighbor);
            }
        }
    }
}

// ── Sliding Window Maximum (Monotonic Deque) ─────────────
int[] maxSlidingWindow(int[] nums, int k) {
    int n = nums.length;
    int[] res = new int[n - k + 1];
    Deque<Integer> dq2 = new ArrayDeque<>();  // stores indices, decreasing values
    for (int i = 0; i < n; i++) {
        while (!dq2.isEmpty() && dq2.peekFirst() < i - k + 1)
            dq2.pollFirst();                   // remove out-of-window
        while (!dq2.isEmpty() && nums[dq2.peekLast()] < nums[i])
            dq2.pollLast();                    // remove smaller elements
        dq2.offerLast(i);
        if (i >= k - 1) res[i - k + 1] = nums[dq2.peekFirst()];
    }
    return res;
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Hashing",
    icon: "⊞",
    color: "#A855F7",
    desc: "HashMap & HashSet give O(1) average for insert, delete, and lookup — workhorse of interview problems.",
    topics: [
      {
        n: "HashMap, HashSet — patterns & problems",
        complexity: { time: "Get/Put/Contains O(1) avg, O(n) worst", space: "O(n)" },
        desc: "HashMap stores key-value pairs. HashSet stores unique values. Both use hash codes internally. Use LinkedHashMap to preserve insertion order, TreeMap for sorted keys. Hashing eliminates the need for nested loops in many O(n²) problems.",
        code: `// ── HashMap API ───────────────────────────────────────────
Map<String, Integer> map = new HashMap<>();
map.put("alice", 95);
map.putIfAbsent("bob", 80);           // only if key absent
map.getOrDefault("carol", 0);         // safe get with default
map.computeIfAbsent("dave", k -> 70); // compute if absent
map.merge("alice", 5, Integer::sum);  // alice = 95 + 5 = 100
map.compute("alice", (k, v) -> v == null ? 1 : v + 1);

for (Map.Entry<String, Integer> e : map.entrySet())
    System.out.println(e.getKey() + " → " + e.getValue());

// ── HashSet API ───────────────────────────────────────────
Set<String> set = new HashSet<>();
set.add("java"); set.add("python"); set.add("java"); // duplicate ignored
boolean has = set.contains("java");  // true
set.remove("python");

// ── Frequency counting ───────────────────────────────────
int[] nums = {1, 2, 3, 2, 1, 3, 3};
Map<Integer, Integer> freq = new HashMap<>();
for (int n : nums) freq.merge(n, 1, Integer::sum);
// {1=2, 2=2, 3=3}

// ── Two Sum (classic) ────────────────────────────────────
int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (seen.containsKey(complement))
            return new int[]{seen.get(complement), i};
        seen.put(nums[i], i);
    }
    return new int[]{};
}

// ── Group anagrams ────────────────────────────────────────
List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> map2 = new HashMap<>();
    for (String s : strs) {
        char[] ch = s.toCharArray();
        Arrays.sort(ch);
        String key = new String(ch);
        map2.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(map2.values());
}

// ── Subarray with 0 sum (prefix sum + HashMap) ───────────
boolean subarrayWithZeroSum(int[] nums) {
    Set<Integer> prefSums = new HashSet<>();
    prefSums.add(0);
    int sum = 0;
    for (int n : nums) {
        sum += n;
        if (prefSums.contains(sum)) return true;
        prefSums.add(sum);
    }
    return false;
}

// ── Longest consecutive sequence ─────────────────────────
int longestConsecutive(int[] nums) {
    Set<Integer> set2 = new HashSet<>();
    for (int n : nums) set2.add(n);
    int longest = 0;
    for (int n : set2) {
        if (!set2.contains(n - 1)) {   // start of sequence
            int cur = n, len = 1;
            while (set2.contains(++cur)) len++;
            longest = Math.max(longest, len);
        }
    }
    return longest;
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Trees",
    icon: "⑂",
    color: "#10B981",
    desc: "Hierarchical structure. Binary trees, BST, and N-ary trees — DFS (pre/in/post) and BFS traversal.",
    topics: [
      {
        n: "Binary tree traversals — recursive & iterative",
        complexity: { time: "O(n)", space: "O(h) where h = height" },
        desc: "Three DFS traversal orders: preorder (root, left, right), inorder (left, root, right — gives sorted order in BST), postorder (left, right, root). BFS visits level by level using a queue. Master both recursive and iterative forms.",
        code: `class TreeNode {
    int val; TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

// ── Recursive traversals ──────────────────────────────────
void preorder(TreeNode root, List<Integer> res) {
    if (root == null) return;
    res.add(root.val);              // ROOT first
    preorder(root.left, res);
    preorder(root.right, res);
}

void inorder(TreeNode root, List<Integer> res) {
    if (root == null) return;
    inorder(root.left, res);
    res.add(root.val);              // ROOT in middle → sorted for BST
    inorder(root.right, res);
}

void postorder(TreeNode root, List<Integer> res) {
    if (root == null) return;
    postorder(root.left, res);
    postorder(root.right, res);
    res.add(root.val);              // ROOT last → used for deletion
}

// ── Iterative inorder (with explicit stack) ───────────────
List<Integer> inorderIterative(TreeNode root) {
    List<Integer> res = new ArrayList<>();
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode cur = root;
    while (cur != null || !stack.isEmpty()) {
        while (cur != null) { stack.push(cur); cur = cur.left; } // go left
        cur = stack.pop();
        res.add(cur.val);           // process node
        cur = cur.right;            // go right
    }
    return res;
}

// ── Level-order BFS ───────────────────────────────────────
List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;
    Queue<TreeNode> q = new LinkedList<>();
    q.offer(root);
    while (!q.isEmpty()) {
        int size = q.size();               // number of nodes at this level
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode node = q.poll();
            level.add(node.val);
            if (node.left  != null) q.offer(node.left);
            if (node.right != null) q.offer(node.right);
        }
        result.add(level);
    }
    return result;
}

// ── Morris Traversal — O(1) space inorder ────────────────
List<Integer> morrisInorder(TreeNode root) {
    List<Integer> res = new ArrayList<>();
    TreeNode cur = root;
    while (cur != null) {
        if (cur.left == null) {
            res.add(cur.val); cur = cur.right;
        } else {
            TreeNode pre = cur.left;
            while (pre.right != null && pre.right != cur) pre = pre.right;
            if (pre.right == null) { pre.right = cur; cur = cur.left; }
            else { pre.right = null; res.add(cur.val); cur = cur.right; }
        }
    }
    return res;
}`
      },
      {
        n: "Binary tree — height, diameter, LCA, path sum",
        complexity: { time: "O(n)", space: "O(h)" },
        desc: "Essential binary tree problems that appear constantly in interviews. Height is the longest path from root to leaf. Diameter is the longest path between any two nodes. LCA finds the lowest common ancestor.",
        code: `// ── Height (max depth) ───────────────────────────────────
int maxDepth(TreeNode root) {
    if (root == null) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}

// ── Check balanced (|leftHeight - rightHeight| <= 1) ─────
int checkHeight(TreeNode root) {
    if (root == null) return 0;
    int left  = checkHeight(root.left);
    if (left  == -1) return -1;
    int right = checkHeight(root.right);
    if (right == -1) return -1;
    if (Math.abs(left - right) > 1) return -1;
    return 1 + Math.max(left, right);
}
boolean isBalanced(TreeNode root) { return checkHeight(root) != -1; }

// ── Diameter (longest path between any two nodes) ─────────
int diameter = 0;
int diameterHelper(TreeNode root) {
    if (root == null) return 0;
    int left  = diameterHelper(root.left);
    int right = diameterHelper(root.right);
    diameter  = Math.max(diameter, left + right);  // path through root
    return 1 + Math.max(left, right);
}

// ── Lowest Common Ancestor ────────────────────────────────
TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;
    TreeNode left  = lowestCommonAncestor(root.left,  p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);
    if (left != null && right != null) return root;  // p and q on opposite sides
    return left != null ? left : right;
}

// ── Path sum — root to leaf ───────────────────────────────
boolean hasPathSum(TreeNode root, int target) {
    if (root == null) return false;
    if (root.left == null && root.right == null) return root.val == target;
    return hasPathSum(root.left,  target - root.val) ||
           hasPathSum(root.right, target - root.val);
}

// ── Max path sum (any path, not just root-to-leaf) ────────
int maxPathSumGlobal = Integer.MIN_VALUE;
int maxPathSumHelper(TreeNode root) {
    if (root == null) return 0;
    int left  = Math.max(0, maxPathSumHelper(root.left));   // ignore if negative
    int right = Math.max(0, maxPathSumHelper(root.right));
    maxPathSumGlobal = Math.max(maxPathSumGlobal, left + root.val + right);
    return root.val + Math.max(left, right);   // one direction only
}

// ── Mirror / invert tree ──────────────────────────────────
TreeNode invertTree(TreeNode root) {
    if (root == null) return null;
    TreeNode tmp = root.left;
    root.left  = invertTree(root.right);
    root.right = invertTree(tmp);
    return root;
}`
      },
      {
        n: "Binary Search Tree — insert, search, validate, kth smallest",
        complexity: { time: "Search/Insert/Delete O(h), O(log n) balanced", space: "O(h)" },
        desc: "BST property: left subtree values < root < right subtree values. Inorder traversal of BST gives sorted order. Validate a BST by passing min/max bounds down the recursion.",
        code: `// ── BST Search ───────────────────────────────────────────
TreeNode searchBST(TreeNode root, int val) {
    if (root == null || root.val == val) return root;
    return val < root.val ? searchBST(root.left, val)
                          : searchBST(root.right, val);
}

// ── BST Insert ────────────────────────────────────────────
TreeNode insertIntoBST(TreeNode root, int val) {
    if (root == null) return new TreeNode(val);
    if (val < root.val) root.left  = insertIntoBST(root.left,  val);
    else                root.right = insertIntoBST(root.right, val);
    return root;
}

// ── BST Delete ────────────────────────────────────────────
TreeNode deleteNode(TreeNode root, int key) {
    if (root == null) return null;
    if      (key < root.val) root.left  = deleteNode(root.left,  key);
    else if (key > root.val) root.right = deleteNode(root.right, key);
    else {
        if (root.left  == null) return root.right;
        if (root.right == null) return root.left;
        // Find inorder successor (min of right subtree)
        TreeNode min = root.right;
        while (min.left != null) min = min.left;
        root.val   = min.val;
        root.right = deleteNode(root.right, min.val);
    }
    return root;
}

// ── Validate BST ─────────────────────────────────────────
boolean isValidBST(TreeNode root) {
    return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
}
boolean validate(TreeNode node, long min, long max) {
    if (node == null) return true;
    if (node.val <= min || node.val >= max) return false;
    return validate(node.left,  min, node.val) &&
           validate(node.right, node.val, max);
}

// ── Kth Smallest in BST (inorder) ────────────────────────
int kthSmallest(TreeNode root, int k) {
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode cur = root;
    while (cur != null || !stack.isEmpty()) {
        while (cur != null) { stack.push(cur); cur = cur.left; }
        cur = stack.pop();
        if (--k == 0) return cur.val;
        cur = cur.right;
    }
    return -1;
}

// ── Build BST from sorted array ───────────────────────────
TreeNode sortedArrayToBST(int[] nums) {
    return buildBST(nums, 0, nums.length - 1);
}
TreeNode buildBST(int[] nums, int lo, int hi) {
    if (lo > hi) return null;
    int mid = lo + (hi - lo) / 2;
    TreeNode node = new TreeNode(nums[mid]);
    node.left  = buildBST(nums, lo, mid - 1);
    node.right = buildBST(nums, mid + 1, hi);
    return node;
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Heap / Priority Queue",
    icon: "△",
    color: "#F97316",
    desc: "Complete binary tree. Min-heap: parent ≤ children. O(log n) insert/delete, O(1) peek min/max.",
    topics: [
      {
        n: "Heap operations, K-th largest, Top K, Merge K sorted",
        complexity: { time: "Offer/Poll O(log n), Peek O(1)", space: "O(k)" },
        desc: "Java's PriorityQueue is a min-heap by default. Invert the comparator for a max-heap. Key patterns: maintain a size-K heap to find K-th largest, merge K sorted lists using a heap, and find the median of a stream using two heaps.",
        code: `// ── Min-Heap (default) ───────────────────────────────────
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.offer(5); minHeap.offer(1); minHeap.offer(3);
int min = minHeap.peek();   // 1
int out = minHeap.poll();   // 1 (removed)

// ── Max-Heap ──────────────────────────────────────────────
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());

// ── Custom comparator heap ─────────────────────────────────
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]); // sort by 2nd element

// ── Kth Largest Element ───────────────────────────────────
// Maintain min-heap of size K
int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> heap = new PriorityQueue<>();
    for (int n : nums) {
        heap.offer(n);
        if (heap.size() > k) heap.poll();  // evict smallest
    }
    return heap.peek();  // Kth largest is root of min-heap
}

// ── Top K Frequent Elements ───────────────────────────────
int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int n : nums) freq.merge(n, 1, Integer::sum);

    PriorityQueue<Integer> heap = new PriorityQueue<>(
        (a, b) -> freq.get(a) - freq.get(b));   // min-heap by frequency

    for (int n : freq.keySet()) {
        heap.offer(n);
        if (heap.size() > k) heap.poll();
    }

    int[] res = new int[k];
    for (int i = k - 1; i >= 0; i--) res[i] = heap.poll();
    return res;
}

// ── Merge K Sorted Lists ──────────────────────────────────
ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue<ListNode> pq2 = new PriorityQueue<>((a, b) -> a.val - b.val);
    for (ListNode node : lists) if (node != null) pq2.offer(node);

    ListNode dummy = new ListNode(0), cur = dummy;
    while (!pq2.isEmpty()) {
        cur.next = pq2.poll();
        cur = cur.next;
        if (cur.next != null) pq2.offer(cur.next);
    }
    return dummy.next;
}

// ── Median of Data Stream (Two Heaps) ─────────────────────
class MedianFinder {
    PriorityQueue<Integer> lo = new PriorityQueue<>(Collections.reverseOrder()); // max-heap: lower half
    PriorityQueue<Integer> hi = new PriorityQueue<>();                            // min-heap: upper half

    void addNum(int num) {
        lo.offer(num);
        hi.offer(lo.poll());        // balance: move max of lo to hi
        if (lo.size() < hi.size()) lo.offer(hi.poll()); // lo >= hi always
    }

    double findMedian() {
        return lo.size() > hi.size()
            ? lo.peek()
            : (lo.peek() + hi.peek()) / 2.0;
    }
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Graphs",
    icon: "◉",
    color: "#06B6D4",
    desc: "Vertices and edges. BFS, DFS, cycle detection, shortest path, topological sort, union-find.",
    topics: [
      {
        n: "Representation, BFS, DFS",
        complexity: { time: "BFS/DFS O(V+E)", space: "O(V+E)" },
        desc: "Graphs can be represented as adjacency list (sparse — preferred), adjacency matrix (dense), or edge list. BFS uses a queue and explores level by level. DFS uses a stack (or recursion) and goes as deep as possible.",
        code: `// ── Adjacency List representation ────────────────────────
int n = 6; // vertices 0..5
List<List<Integer>> adj = new ArrayList<>();
for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
adj.get(0).add(1); adj.get(0).add(2);
adj.get(1).add(3); adj.get(2).add(4); adj.get(3).add(5);

// Weighted graph
List<List<int[]>> wAdj = new ArrayList<>();
for (int i = 0; i < n; i++) wAdj.add(new ArrayList<>());
wAdj.get(0).add(new int[]{1, 4});  // edge 0→1, weight=4
wAdj.get(0).add(new int[]{2, 1});  // edge 0→2, weight=1

// ── BFS — shortest path in unweighted graph ────────────────
int[] bfsShortestPath(List<List<Integer>> adj, int src, int n) {
    int[] dist = new int[n];
    Arrays.fill(dist, -1);
    dist[src] = 0;
    Queue<Integer> q = new LinkedList<>();
    q.offer(src);
    while (!q.isEmpty()) {
        int node = q.poll();
        for (int nei : adj.get(node)) {
            if (dist[nei] == -1) {
                dist[nei] = dist[node] + 1;
                q.offer(nei);
            }
        }
    }
    return dist; // dist[i] = shortest distance from src to i
}

// ── DFS — count connected components ──────────────────────
int countComponents(int n, int[][] edges) {
    List<List<Integer>> adj2 = new ArrayList<>();
    for (int i = 0; i < n; i++) adj2.add(new ArrayList<>());
    for (int[] e : edges) {
        adj2.get(e[0]).add(e[1]);
        adj2.get(e[1]).add(e[0]);
    }
    boolean[] visited = new boolean[n];
    int count = 0;
    for (int i = 0; i < n; i++) {
        if (!visited[i]) { dfs(adj2, visited, i); count++; }
    }
    return count;
}
void dfs(List<List<Integer>> adj, boolean[] vis, int node) {
    vis[node] = true;
    for (int nei : adj.get(node)) if (!vis[nei]) dfs(adj, vis, nei);
}

// ── Grid BFS — number of islands ─────────────────────────
int numIslands(char[][] grid) {
    int count = 0, rows = grid.length, cols = grid[0].length;
    int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}};
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] == '1') {
                count++;
                Queue<int[]> q2 = new LinkedList<>();
                q2.offer(new int[]{r, c});
                grid[r][c] = '0'; // mark visited
                while (!q2.isEmpty()) {
                    int[] cell = q2.poll();
                    for (int[] d : dirs) {
                        int nr = cell[0]+d[0], nc = cell[1]+d[1];
                        if (nr>=0 && nr<rows && nc>=0 && nc<cols && grid[nr][nc]=='1') {
                            grid[nr][nc] = '0';
                            q2.offer(new int[]{nr, nc});
                        }
                    }
                }
            }
        }
    }
    return count;
}`
      },
      {
        n: "Topological Sort, Cycle Detection, Union-Find",
        complexity: { time: "Topo/Cycle O(V+E), Union-Find O(α(n))≈O(1)", space: "O(V)" },
        desc: "Topological sort orders DAG vertices. Cycle detection uses DFS with color states or Kahn's algorithm. Union-Find (Disjoint Set) efficiently tracks connected components with union by rank and path compression.",
        code: `// ── Topological Sort — Kahn's Algorithm (BFS) ────────────
int[] topoSort(int n, int[][] prerequisites) {
    List<List<Integer>> adj = new ArrayList<>();
    int[] indegree = new int[n];
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    for (int[] e : prerequisites) { adj.get(e[1]).add(e[0]); indegree[e[0]]++; }

    Queue<Integer> q = new LinkedList<>();
    for (int i = 0; i < n; i++) if (indegree[i] == 0) q.offer(i);

    int[] order = new int[n]; int idx = 0;
    while (!q.isEmpty()) {
        int node = q.poll();
        order[idx++] = node;
        for (int nei : adj.get(node)) if (--indegree[nei] == 0) q.offer(nei);
    }
    return idx == n ? order : new int[]{};  // empty if cycle exists
}

// ── Cycle Detection in Directed Graph (DFS, 3-color) ──────
// 0=white(unvisited), 1=gray(in stack), 2=black(done)
boolean hasCycleDirected(int n, List<List<Integer>> adj) {
    int[] color = new int[n];
    for (int i = 0; i < n; i++) if (color[i] == 0 && dfsCycle(adj, color, i)) return true;
    return false;
}
boolean dfsCycle(List<List<Integer>> adj, int[] color, int node) {
    color[node] = 1;  // mark gray (in current path)
    for (int nei : adj.get(node)) {
        if (color[nei] == 1) return true;  // back edge = cycle
        if (color[nei] == 0 && dfsCycle(adj, color, nei)) return true;
    }
    color[node] = 2;  // mark black (done)
    return false;
}

// ── Union-Find (Disjoint Set Union) ─────────────────────
class UnionFind {
    int[] parent, rank;

    UnionFind(int n) {
        parent = new int[n]; rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]); // path compression
        return parent[x];
    }

    boolean union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;  // already connected
        if (rank[px] < rank[py]) { int t=px; px=py; py=t; }
        parent[py] = px;
        if (rank[px] == rank[py]) rank[px]++;
        return true;
    }

    boolean connected(int x, int y) { return find(x) == find(y); }
}

// ── Kruskal's MST using Union-Find ───────────────────────
int minimumSpanningTree(int n, int[][] edges) {
    Arrays.sort(edges, (a, b) -> a[2] - b[2]); // sort by weight
    UnionFind uf = new UnionFind(n);
    int cost = 0, edgesUsed = 0;
    for (int[] e : edges) {
        if (uf.union(e[0], e[1])) {
            cost += e[2];
            if (++edgesUsed == n - 1) break;
        }
    }
    return edgesUsed == n - 1 ? cost : -1;
}`
      },
      {
        n: "Dijkstra, Bellman-Ford, Floyd-Warshall",
        complexity: { time: "Dijkstra O((V+E)logV), Bellman-Ford O(VE), Floyd O(V³)", space: "O(V²)" },
        desc: "Dijkstra finds single-source shortest paths in graphs with non-negative weights using a priority queue. Bellman-Ford handles negative weights and detects negative cycles. Floyd-Warshall computes all-pairs shortest paths.",
        code: `// ── Dijkstra's Algorithm ─────────────────────────────────
int[] dijkstra(int src, int n, List<List<int[]>> adj) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;

    // PQ: [distance, node]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, src});

    while (!pq.isEmpty()) {
        int[] cur = pq.poll();
        int d = cur[0], node = cur[1];
        if (d > dist[node]) continue;  // stale entry

        for (int[] edge : adj.get(node)) {
            int nei = edge[0], weight = edge[1];
            int newDist = dist[node] + weight;
            if (newDist < dist[nei]) {
                dist[nei] = newDist;
                pq.offer(new int[]{newDist, nei});
            }
        }
    }
    return dist;
}

// ── Bellman-Ford ──────────────────────────────────────────
int[] bellmanFord(int src, int n, int[][] edges) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;

    // Relax all edges n-1 times
    for (int i = 0; i < n - 1; i++) {
        for (int[] e : edges) {   // e = [u, v, weight]
            if (dist[e[0]] != Integer.MAX_VALUE && dist[e[0]] + e[2] < dist[e[1]])
                dist[e[1]] = dist[e[0]] + e[2];
        }
    }

    // nth pass: negative cycle check
    for (int[] e : edges) {
        if (dist[e[0]] != Integer.MAX_VALUE && dist[e[0]] + e[2] < dist[e[1]])
            throw new RuntimeException("Negative cycle detected");
    }
    return dist;
}

// ── Floyd-Warshall — all pairs shortest paths ─────────────
int[][] floydWarshall(int[][] graph, int n) {
    int[][] dist2 = new int[n][n];
    for (int[] row : dist2) Arrays.fill(row, Integer.MAX_VALUE / 2);
    for (int i = 0; i < n; i++) dist2[i][i] = 0;
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            if (graph[i][j] != 0) dist2[i][j] = graph[i][j];

    for (int k = 0; k < n; k++)         // intermediate vertex
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                dist2[i][j] = Math.min(dist2[i][j], dist2[i][k] + dist2[k][j]);
    return dist2;
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Sorting Algorithms",
    icon: "⇅",
    color: "#EC4899",
    desc: "From O(n²) comparison sorts to O(n log n) efficient sorts and O(n) non-comparison sorts.",
    topics: [
      {
        n: "Merge Sort, Quick Sort, Heap Sort",
        complexity: { time: "Merge O(n log n), Quick O(n log n) avg O(n²) worst, Heap O(n log n)", space: "Merge O(n), Quick O(log n), Heap O(1)" },
        desc: "Merge Sort: stable, guaranteed O(n log n), extra space. Quick Sort: in-place, cache-friendly, O(n²) worst with bad pivot. Heap Sort: in-place, O(n log n) guaranteed but not cache-friendly.",
        code: `// ── Merge Sort ───────────────────────────────────────────
void mergeSort(int[] arr, int lo, int hi) {
    if (lo >= hi) return;
    int mid = lo + (hi - lo) / 2;
    mergeSort(arr, lo, mid);
    mergeSort(arr, mid + 1, hi);
    merge(arr, lo, mid, hi);
}

void merge(int[] arr, int lo, int mid, int hi) {
    int[] left  = Arrays.copyOfRange(arr, lo, mid + 1);
    int[] right = Arrays.copyOfRange(arr, mid + 1, hi + 1);
    int i = 0, j = 0, k = lo;
    while (i < left.length && j < right.length)
        arr[k++] = left[i] <= right[j] ? left[i++] : right[j++];
    while (i < left.length)  arr[k++] = left[i++];
    while (j < right.length) arr[k++] = right[j++];
}

// ── Quick Sort ───────────────────────────────────────────
void quickSort(int[] arr, int lo, int hi) {
    if (lo >= hi) return;
    int pivotIdx = partition(arr, lo, hi);
    quickSort(arr, lo, pivotIdx - 1);
    quickSort(arr, pivotIdx + 1, hi);
}

int partition(int[] arr, int lo, int hi) {
    int pivot = arr[hi];          // last element as pivot
    int i = lo - 1;
    for (int j = lo; j < hi; j++) {
        if (arr[j] <= pivot) {
            i++;
            int tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
    }
    int tmp = arr[i+1]; arr[i+1] = arr[hi]; arr[hi] = tmp;
    return i + 1;
}

// ── Heap Sort ────────────────────────────────────────────
void heapSort(int[] arr) {
    int n = arr.length;
    for (int i = n/2 - 1; i >= 0; i--) heapify(arr, n, i);   // build max-heap
    for (int i = n - 1; i > 0; i--) {
        int tmp = arr[0]; arr[0] = arr[i]; arr[i] = tmp;       // move root to end
        heapify(arr, i, 0);                                      // re-heapify
    }
}
void heapify(int[] arr, int n, int i) {
    int largest = i, l = 2*i+1, r = 2*i+2;
    if (l < n && arr[l] > arr[largest]) largest = l;
    if (r < n && arr[r] > arr[largest]) largest = r;
    if (largest != i) {
        int tmp = arr[i]; arr[i] = arr[largest]; arr[largest] = tmp;
        heapify(arr, n, largest);
    }
}

// ── Counting Sort (O(n+k), non-comparison) ───────────────
int[] countingSort(int[] arr, int maxVal) {
    int[] count = new int[maxVal + 1];
    for (int n : arr) count[n]++;
    for (int i = 1; i <= maxVal; i++) count[i] += count[i-1]; // prefix sums
    int[] res = new int[arr.length];
    for (int i = arr.length - 1; i >= 0; i--) res[--count[arr[i]]] = arr[i];
    return res;
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Binary Search",
    icon: "⟨⟩",
    color: "#F59E0B",
    desc: "O(log n) search on sorted data. Generalises to search on the answer space — bisect on any monotonic predicate.",
    topics: [
      {
        n: "Binary search templates — classic, left bound, right bound",
        complexity: { time: "O(log n)", space: "O(1)" },
        desc: "Three essential templates: classic (find exact value), left boundary (first occurrence / leftmost position satisfying condition), right boundary (last occurrence). The key insight: binary search works on any monotonic function, not just sorted arrays.",
        code: `// ── Template 1: Classic — find exact target ───────────────
int binarySearch(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;  // avoid integer overflow
        if      (nums[mid] == target) return mid;
        else if (nums[mid] <  target) lo = mid + 1;
        else                          hi = mid - 1;
    }
    return -1;  // not found
}

// ── Template 2: Left boundary — first occurrence / leftmost ─
int leftBound(int[] nums, int target) {
    int lo = 0, hi = nums.length;  // hi = length (exclusive)
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] < target) lo = mid + 1;
        else                    hi = mid;     // keep shrinking right
    }
    // lo is the leftmost index where nums[lo] >= target
    return lo < nums.length && nums[lo] == target ? lo : -1;
}

// ── Template 3: Right boundary — last occurrence ──────────
int rightBound(int[] nums, int target) {
    int lo = 0, hi = nums.length;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] <= target) lo = mid + 1;
        else                     hi = mid;
    }
    // lo-1 is the rightmost index where nums[lo-1] <= target
    return lo > 0 && nums[lo - 1] == target ? lo - 1 : -1;
}

// ── Search in rotated sorted array ────────────────────────
int searchRotated(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] == target) return mid;

        if (nums[lo] <= nums[mid]) {         // left half sorted
            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {                              // right half sorted
            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
}

// ── Find peak element ─────────────────────────────────────
int findPeakElement(int[] nums) {
    int lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] > nums[mid + 1]) hi = mid;  // peak is on left (incl. mid)
        else                           lo = mid + 1;
    }
    return lo;
}

// ── Sqrt(x) using binary search ──────────────────────────
int mySqrt(int x) {
    if (x < 2) return x;
    long lo = 1, hi = x / 2;
    while (lo <= hi) {
        long mid = lo + (hi - lo) / 2;
        if      (mid * mid == x) return (int) mid;
        else if (mid * mid < x)  lo = mid + 1;
        else                     hi = mid - 1;
    }
    return (int) hi;
}`
      },
      {
        n: "Binary search on answer — minimize/maximize problems",
        complexity: { time: "O(n log(max-min))", space: "O(1)" },
        desc: "The most powerful binary search technique: instead of searching in an array, search on the answer space. Ask 'Is it possible to achieve X?' and binary search on X. Used for allocation problems, capacity minimization, and scheduling.",
        code: `// ── Minimum capacity to ship packages in D days ──────────
// Is it possible to ship all packages with given capacity in D days?
boolean canShip(int[] weights, int cap, int days) {
    int currentLoad = 0, daysNeeded = 1;
    for (int w : weights) {
        if (currentLoad + w > cap) { daysNeeded++; currentLoad = 0; }
        currentLoad += w;
    }
    return daysNeeded <= days;
}

int shipWithinDays(int[] weights, int days) {
    int lo = 0, hi = 0;
    for (int w : weights) { lo = Math.max(lo, w); hi += w; } // lo=max weight, hi=total
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (canShip(weights, mid, days)) hi = mid;  // try smaller capacity
        else                             lo = mid + 1;
    }
    return lo;
}

// ── Koko eating bananas — min eating speed ────────────────
int minEatingSpeed(int[] piles, int h) {
    int lo = 1, hi = 0;
    for (int p : piles) hi = Math.max(hi, p);

    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        int hours = 0;
        for (int p : piles) hours += (p + mid - 1) / mid;  // ceil(p/mid)
        if (hours <= h) hi = mid;  // can eat slower
        else            lo = mid + 1;
    }
    return lo;
}

// ── Allocate minimum pages (Painter/Librarian problem) ────
boolean canAllocate(int[] pages, int students, int maxPages) {
    int curSum = 0, count = 1;
    for (int p : pages) {
        if (curSum + p > maxPages) { count++; curSum = 0; }
        curSum += p;
    }
    return count <= students;
}

int allocateMinPages(int[] pages, int students) {
    int lo = Arrays.stream(pages).max().getAsInt();
    int hi = Arrays.stream(pages).sum();
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (canAllocate(pages, students, mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Recursion & Backtracking",
    icon: "↺",
    color: "#8B5CF6",
    desc: "Explore all possibilities by making choices and undoing them. Power sets, permutations, N-Queens, Sudoku.",
    topics: [
      {
        n: "Subsets, Permutations, Combinations",
        complexity: { time: "Subsets O(n·2ⁿ), Perms O(n·n!), Combos O(n·C(n,k))", space: "O(n)" },
        desc: "Backtracking template: make a choice → recurse → undo the choice. For subsets include/exclude each element. For permutations swap elements. For combinations use a start index to avoid repeats.",
        code: `// ── Subsets — power set ──────────────────────────────────
List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrackSubsets(nums, 0, new ArrayList<>(), result);
    return result;
}
void backtrackSubsets(int[] nums, int start, List<Integer> cur, List<List<Integer>> res) {
    res.add(new ArrayList<>(cur));        // add current subset (including empty)
    for (int i = start; i < nums.length; i++) {
        cur.add(nums[i]);                 // choose
        backtrackSubsets(nums, i + 1, cur, res); // explore
        cur.remove(cur.size() - 1);       // un-choose
    }
}

// ── Permutations ──────────────────────────────────────────
List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrackPerms(nums, new boolean[nums.length], new ArrayList<>(), result);
    return result;
}
void backtrackPerms(int[] nums, boolean[] used, List<Integer> cur, List<List<Integer>> res) {
    if (cur.size() == nums.length) { res.add(new ArrayList<>(cur)); return; }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        used[i] = true; cur.add(nums[i]);
        backtrackPerms(nums, used, cur, res);
        used[i] = false; cur.remove(cur.size() - 1);
    }
}

// ── Combinations ──────────────────────────────────────────
List<List<Integer>> combine(int n, int k) {
    List<List<Integer>> result = new ArrayList<>();
    backtrackCombine(1, n, k, new ArrayList<>(), result);
    return result;
}
void backtrackCombine(int start, int n, int k, List<Integer> cur, List<List<Integer>> res) {
    if (cur.size() == k) { res.add(new ArrayList<>(cur)); return; }
    for (int i = start; i <= n - (k - cur.size()) + 1; i++) { // pruning
        cur.add(i);
        backtrackCombine(i + 1, n, k, cur, res);
        cur.remove(cur.size() - 1);
    }
}

// ── Combination Sum (with repeats allowed) ────────────────
List<List<Integer>> combinationSum(int[] candidates, int target) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(candidates);
    backtrackCombSum(candidates, 0, target, new ArrayList<>(), result);
    return result;
}
void backtrackCombSum(int[] cands, int start, int remain, List<Integer> cur, List<List<Integer>> res) {
    if (remain == 0) { res.add(new ArrayList<>(cur)); return; }
    for (int i = start; i < cands.length && cands[i] <= remain; i++) {
        cur.add(cands[i]);
        backtrackCombSum(cands, i, remain - cands[i], cur, res); // i (not i+1) = repeats allowed
        cur.remove(cur.size() - 1);
    }
}`
      },
      {
        n: "N-Queens, Sudoku Solver, Word Search",
        complexity: { time: "N-Queens O(n!), Sudoku O(9^81) worst practical O(1)", space: "O(n)" },
        desc: "Classic backtracking problems with constraints. N-Queens places N queens on N×N board with no conflicts. Sudoku fills empty cells respecting row/column/box uniqueness. Word Search explores grid cells finding a path that spells a word.",
        code: `// ── N-Queens ──────────────────────────────────────────────
List<List<String>> solveNQueens(int n) {
    List<List<String>> result = new ArrayList<>();
    int[] queens = new int[n];         // queens[row] = column
    Arrays.fill(queens, -1);
    Set<Integer> cols = new HashSet<>(), diag1 = new HashSet<>(), diag2 = new HashSet<>();
    solveNQ(queens, n, 0, cols, diag1, diag2, result);
    return result;
}

void solveNQ(int[] queens, int n, int row,
             Set<Integer> cols, Set<Integer> d1, Set<Integer> d2,
             List<List<String>> res) {
    if (row == n) {
        res.add(buildBoard(queens, n)); return;
    }
    for (int col = 0; col < n; col++) {
        if (cols.contains(col) || d1.contains(row - col) || d2.contains(row + col)) continue;
        queens[row] = col;
        cols.add(col); d1.add(row - col); d2.add(row + col);
        solveNQ(queens, n, row + 1, cols, d1, d2, res);
        queens[row] = -1;
        cols.remove(col); d1.remove(row - col); d2.remove(row + col);
    }
}

List<String> buildBoard(int[] queens, int n) {
    List<String> board = new ArrayList<>();
    for (int col : queens) {
        char[] row = new char[n]; Arrays.fill(row, '.');
        row[col] = 'Q'; board.add(new String(row));
    }
    return board;
}

// ── Sudoku Solver ─────────────────────────────────────────
boolean solveSudoku(char[][] board) {
    for (int r = 0; r < 9; r++) {
        for (int c = 0; c < 9; c++) {
            if (board[r][c] != '.') continue;
            for (char ch = '1'; ch <= '9'; ch++) {
                if (isValidSudoku(board, r, c, ch)) {
                    board[r][c] = ch;
                    if (solveSudoku(board)) return true;
                    board[r][c] = '.';
                }
            }
            return false;  // no valid digit found
        }
    }
    return true;  // all cells filled
}

boolean isValidSudoku(char[][] board, int r, int c, char ch) {
    for (int i = 0; i < 9; i++) {
        if (board[r][i] == ch || board[i][c] == ch) return false;
        int br = 3*(r/3)+i/3, bc = 3*(c/3)+i%3;
        if (board[br][bc] == ch) return false;
    }
    return true;
}

// ── Word Search ───────────────────────────────────────────
boolean exist(char[][] board, String word) {
    int rows = board.length, cols = board[0].length;
    for (int r = 0; r < rows; r++)
        for (int c = 0; c < cols; c++)
            if (dfsWord(board, word, r, c, 0)) return true;
    return false;
}
boolean dfsWord(char[][] board, String word, int r, int c, int idx) {
    if (idx == word.length()) return true;
    if (r<0||r>=board.length||c<0||c>=board[0].length||board[r][c]!=word.charAt(idx)) return false;
    char tmp = board[r][c]; board[r][c] = '#';  // mark visited
    boolean found = dfsWord(board,word,r+1,c,idx+1) || dfsWord(board,word,r-1,c,idx+1)
                 || dfsWord(board,word,r,c+1,idx+1) || dfsWord(board,word,r,c-1,idx+1);
    board[r][c] = tmp;  // restore
    return found;
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Dynamic Programming",
    icon: "⊕",
    color: "#10B981",
    desc: "Break problems into overlapping sub-problems. Store results (memoization/tabulation) to avoid recomputation.",
    topics: [
      {
        n: "1D DP — Fibonacci, Climbing Stairs, House Robber, Coin Change",
        complexity: { time: "O(n)", space: "O(n) table, O(1) optimized" },
        desc: "1D DP builds a 1D table where each cell depends on a few previous cells. Optimize space by keeping only the last 1-2 values. Key insight: define the state, write the recurrence, identify base cases.",
        code: `// ── Fibonacci (top-down memoization) ─────────────────────
Map<Integer, Long> memo = new HashMap<>();
long fib(int n) {
    if (n <= 1) return n;
    if (memo.containsKey(n)) return memo.get(n);
    long result = fib(n-1) + fib(n-2);
    memo.put(n, result);
    return result;
}

// ── Fibonacci (bottom-up tabulation, O(1) space) ──────────
long fibTab(int n) {
    if (n <= 1) return n;
    long prev2 = 0, prev1 = 1;
    for (int i = 2; i <= n; i++) { long cur = prev1 + prev2; prev2 = prev1; prev1 = cur; }
    return prev1;
}

// ── Climbing Stairs (distinct ways to reach top) ──────────
// dp[i] = ways to reach step i = dp[i-1] + dp[i-2]
int climbStairs(int n) {
    if (n <= 2) return n;
    int a = 1, b = 2;
    for (int i = 3; i <= n; i++) { int c = a + b; a = b; b = c; }
    return b;
}

// ── House Robber ──────────────────────────────────────────
// Can't rob adjacent houses. Maximise money.
int rob(int[] nums) {
    int prev2 = 0, prev1 = 0;
    for (int n : nums) { int cur = Math.max(prev1, prev2 + n); prev2 = prev1; prev1 = cur; }
    return prev1;
}

// ── House Robber II (circular) ────────────────────────────
int robII(int[] nums) {
    if (nums.length == 1) return nums[0];
    return Math.max(rob(Arrays.copyOfRange(nums, 0, nums.length-1)),
                    rob(Arrays.copyOfRange(nums, 1, nums.length)));
}

// ── Coin Change — minimum coins to make amount ────────────
int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);     // large sentinel
    dp[0] = 0;
    for (int i = 1; i <= amount; i++)
        for (int coin : coins)
            if (coin <= i) dp[i] = Math.min(dp[i], dp[i - coin] + 1);
    return dp[amount] > amount ? -1 : dp[amount];
}

// ── Coin Change II — number of ways to make amount ────────
int change(int amount, int[] coins) {
    int[] dp = new int[amount + 1];
    dp[0] = 1;
    for (int coin : coins)                 // outer: coins (prevent duplicate combos)
        for (int i = coin; i <= amount; i++)
            dp[i] += dp[i - coin];
    return dp[amount];
}

// ── Word Break ────────────────────────────────────────────
boolean wordBreak(String s, List<String> wordDict) {
    Set<String> dict = new HashSet<>(wordDict);
    boolean[] dp = new boolean[s.length() + 1];
    dp[0] = true;
    for (int i = 1; i <= s.length(); i++)
        for (int j = 0; j < i; j++)
            if (dp[j] && dict.contains(s.substring(j, i))) { dp[i] = true; break; }
    return dp[s.length()];
}`
      },
      {
        n: "2D DP — LCS, LIS, Edit Distance, 0/1 Knapsack",
        complexity: { time: "O(n·m) or O(n²)", space: "O(n·m), optimizable to O(n)" },
        desc: "2D DP uses a table where dp[i][j] represents the solution for subproblem involving the first i elements of one input and first j of another. LCS, Edit Distance, and Knapsack are fundamental 2D DP problems.",
        code: `// ── Longest Common Subsequence (LCS) ─────────────────────
int lcs(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[][] dp = new int[m+1][n+1];
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            dp[i][j] = s1.charAt(i-1) == s2.charAt(j-1)
                ? dp[i-1][j-1] + 1
                : Math.max(dp[i-1][j], dp[i][j-1]);
    return dp[m][n];
}

// ── Longest Increasing Subsequence (LIS) O(n log n) ───────
int lis(int[] nums) {
    List<Integer> tails = new ArrayList<>();
    for (int n : nums) {
        int lo = 0, hi = tails.size();
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (tails.get(mid) < n) lo = mid + 1; else hi = mid;
        }
        if (lo == tails.size()) tails.add(n);
        else                    tails.set(lo, n);
    }
    return tails.size();
}

// ── Edit Distance (Levenshtein) ───────────────────────────
int minDistance(String word1, String word2) {
    int m = word1.length(), n = word2.length();
    int[][] dp = new int[m+1][n+1];
    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++) {
            if (word1.charAt(i-1) == word2.charAt(j-1)) dp[i][j] = dp[i-1][j-1];
            else dp[i][j] = 1 + Math.min(dp[i-1][j-1],  // replace
                               Math.min(dp[i-1][j],       // delete
                                        dp[i][j-1]));     // insert
        }
    return dp[m][n];
}

// ── 0/1 Knapsack ─────────────────────────────────────────
int knapsack(int[] weights, int[] values, int capacity) {
    int n = weights.length;
    int[][] dp = new int[n+1][capacity+1];
    for (int i = 1; i <= n; i++)
        for (int w = 0; w <= capacity; w++) {
            dp[i][w] = dp[i-1][w];                       // don't take item i
            if (weights[i-1] <= w)
                dp[i][w] = Math.max(dp[i][w],
                    values[i-1] + dp[i-1][w - weights[i-1]]); // take item i
        }
    return dp[n][capacity];
}

// ── Partition Equal Subset Sum ────────────────────────────
boolean canPartition(int[] nums) {
    int total = Arrays.stream(nums).sum();
    if (total % 2 != 0) return false;
    int target = total / 2;
    boolean[] dp = new boolean[target + 1];
    dp[0] = true;
    for (int n : nums)
        for (int j = target; j >= n; j--)  // iterate backwards for 0/1 knapsack
            dp[j] = dp[j] || dp[j - n];
    return dp[target];
}

// ── Matrix Chain Multiplication / Palindrome DP ──────────
int longestPalindromicSubsequence(String s) {
    int n = s.length();
    int[][] dp = new int[n][n];
    for (int i = 0; i < n; i++) dp[i][i] = 1;
    for (int len = 2; len <= n; len++)
        for (int i = 0; i <= n - len; i++) {
            int j = i + len - 1;
            dp[i][j] = s.charAt(i) == s.charAt(j)
                ? 2 + dp[i+1][j-1]
                : Math.max(dp[i+1][j], dp[i][j-1]);
        }
    return dp[0][n-1];
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Trie (Prefix Tree)",
    icon: "⊳",
    color: "#06B6D4",
    desc: "Tree of characters. O(m) insert/search where m = word length. Ideal for prefix queries, autocomplete, IP routing.",
    topics: [
      {
        n: "Trie — insert, search, startsWith, word search II",
        complexity: { time: "Insert/Search O(m)", space: "O(m·n) where n = number of words" },
        desc: "Each Trie node has up to 26 children (for lowercase letters). Mark the end of a word with a flag. Use a Trie when you need fast prefix lookup, autocomplete suggestions, or spell checking.",
        code: `// ── Trie Node ─────────────────────────────────────────────
class TrieNode {
    TrieNode[] children = new TrieNode[26];
    boolean isEnd = false;
    String word = null;  // useful for Word Search II
}

// ── Trie class ────────────────────────────────────────────
class Trie {
    TrieNode root = new TrieNode();

    void insert(String word) {
        TrieNode cur = root;
        for (char c : word.toCharArray()) {
            int idx = c - 'a';
            if (cur.children[idx] == null) cur.children[idx] = new TrieNode();
            cur = cur.children[idx];
        }
        cur.isEnd = true;
        cur.word  = word;
    }

    boolean search(String word) {
        TrieNode node = find(word);
        return node != null && node.isEnd;
    }

    boolean startsWith(String prefix) {
        return find(prefix) != null;
    }

    private TrieNode find(String s) {
        TrieNode cur = root;
        for (char c : s.toCharArray()) {
            int idx = c - 'a';
            if (cur.children[idx] == null) return null;
            cur = cur.children[idx];
        }
        return cur;
    }

    // Return all words with given prefix (autocomplete)
    List<String> autocomplete(String prefix) {
        List<String> result = new ArrayList<>();
        TrieNode node = find(prefix);
        if (node != null) collectWords(node, result);
        return result;
    }

    private void collectWords(TrieNode node, List<String> result) {
        if (node.isEnd) result.add(node.word);
        for (TrieNode child : node.children)
            if (child != null) collectWords(child, result);
    }
}

// ── Word Search II — find all dictionary words in grid ────
List<String> findWords(char[][] board, String[] words) {
    Trie trie = new Trie();
    for (String word : words) trie.insert(word);
    List<String> result = new ArrayList<>();
    int rows = board.length, cols = board[0].length;
    for (int r = 0; r < rows; r++)
        for (int c = 0; c < cols; c++)
            dfsWordSearch(board, trie.root, r, c, result);
    return result;
}

void dfsWordSearch(char[][] board, TrieNode node, int r, int c, List<String> res) {
    if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) return;
    char ch = board[r][c];
    if (ch == '#' || node.children[ch - 'a'] == null) return;
    node = node.children[ch - 'a'];
    if (node.word != null) { res.add(node.word); node.word = null; } // found!
    board[r][c] = '#';
    dfsWordSearch(board, node, r+1, c, res); dfsWordSearch(board, node, r-1, c, res);
    dfsWordSearch(board, node, r, c+1, res); dfsWordSearch(board, node, r, c-1, res);
    board[r][c] = ch;
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Greedy Algorithms",
    icon: "★",
    color: "#EC4899",
    desc: "Make the locally optimal choice at each step — works when local optimum leads to global optimum.",
    topics: [
      {
        n: "Interval scheduling, Jump Game, Gas Station, Activity Selection",
        complexity: { time: "O(n log n) with sorting, O(n) after", space: "O(1) to O(n)" },
        desc: "Greedy works when the problem has the greedy-choice property and optimal substructure. Sort by end time for interval problems. Prove correctness by exchange argument — any deviation from greedy leads to worse or equal solution.",
        code: `// ── Merge Intervals ───────────────────────────────────────
int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);  // sort by start
    List<int[]> res = new ArrayList<>();
    res.add(intervals[0]);
    for (int i = 1; i < intervals.length; i++) {
        int[] last = res.get(res.size() - 1);
        if (intervals[i][0] <= last[1])               // overlap
            last[1] = Math.max(last[1], intervals[i][1]);
        else
            res.add(intervals[i]);
    }
    return res.toArray(new int[0][]);
}

// ── Non-overlapping intervals (min removals) ──────────────
int eraseOverlapIntervals(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[1] - b[1]);  // sort by END time (greedy)
    int removals = 0, lastEnd = Integer.MIN_VALUE;
    for (int[] iv : intervals) {
        if (iv[0] >= lastEnd) lastEnd = iv[1];   // no overlap — take it
        else removals++;                           // overlap — remove it
    }
    return removals;
}

// ── Jump Game — can you reach the last index? ─────────────
boolean canJump(int[] nums) {
    int maxReach = 0;
    for (int i = 0; i < nums.length; i++) {
        if (i > maxReach) return false;
        maxReach = Math.max(maxReach, i + nums[i]);
    }
    return true;
}

// ── Jump Game II — minimum jumps to reach end ─────────────
int jump(int[] nums) {
    int jumps = 0, curEnd = 0, farthest = 0;
    for (int i = 0; i < nums.length - 1; i++) {
        farthest = Math.max(farthest, i + nums[i]);
        if (i == curEnd) { jumps++; curEnd = farthest; }   // must jump
    }
    return jumps;
}

// ── Gas Station — circular route ─────────────────────────
int canCompleteCircuit(int[] gas, int[] cost) {
    int totalSurplus = 0, curSurplus = 0, start = 0;
    for (int i = 0; i < gas.length; i++) {
        totalSurplus += gas[i] - cost[i];
        curSurplus   += gas[i] - cost[i];
        if (curSurplus < 0) { start = i + 1; curSurplus = 0; }
    }
    return totalSurplus >= 0 ? start : -1;
}

// ── Task Scheduler — minimum time with cooldown ───────────
int leastInterval(char[] tasks, int n) {
    int[] freq = new int[26];
    for (char c : tasks) freq[c - 'A']++;
    Arrays.sort(freq);
    int maxFreq = freq[25];
    int idleSlots = (maxFreq - 1) * n;
    for (int i = 24; i >= 0; i--) idleSlots -= Math.min(freq[i], maxFreq - 1);
    return tasks.length + Math.max(0, idleSlots);
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Bit Manipulation",
    icon: "⊻",
    color: "#F97316",
    desc: "Direct binary operations — O(1) tricks for XOR, masking, counting bits, power-of-2 checks.",
    topics: [
      {
        n: "Bit tricks, XOR, popcount, power of 2",
        complexity: { time: "O(1) to O(log n)", space: "O(1)" },
        desc: "Bit manipulation avoids division, conditionals, and data structures. XOR is the Swiss army knife — it cancels duplicates, swaps without temp variable, and finds missing numbers. Mastering these patterns drastically speeds up certain DSA problems.",
        code: `// ── Bitwise operators ─────────────────────────────────────
int a = 0b1010, b = 0b1100;
int and  = a & b;   // 0b1000 = 8   (both bits 1)
int or   = a | b;   // 0b1110 = 14  (either bit 1)
int xor  = a ^ b;   // 0b0110 = 6   (exactly one bit 1)
int not  = ~a;      // flip all bits
int lsh  = a << 2;  // 0b101000 = 40 (multiply by 4)
int rsh  = a >> 1;  // 0b0101  = 5  (divide by 2)
int ursh = a >>> 1; // unsigned right shift (fills with 0)

// ── Common bit tricks ─────────────────────────────────────
boolean isPowerOf2(int n) { return n > 0 && (n & (n-1)) == 0; }
int clearLowestBit(int n)  { return n & (n-1); }       // n=12(1100) → 8(1000)
int isolateLowestBit(int n){ return n & (-n); }         // n=12(1100) → 4(0100)
int setBit(int n, int i)   { return n | (1 << i); }    // set bit i
int clearBit(int n, int i) { return n & ~(1 << i); }   // clear bit i
int toggleBit(int n, int i){ return n ^ (1 << i); }    // toggle bit i
boolean testBit(int n,int i){ return (n >> i & 1) == 1; }

// ── Count set bits (Brian Kernighan's) ────────────────────
int popcount(int n) {
    int count = 0;
    while (n != 0) { n &= n - 1; count++; }  // clear lowest set bit
    return count;
    // Or: Integer.bitCount(n);
}

// ── Counting Bits for 0..n (DP) ──────────────────────────
int[] countBits(int n) {
    int[] dp = new int[n + 1];
    for (int i = 1; i <= n; i++) dp[i] = dp[i >> 1] + (i & 1); // dp[i] = dp[i/2] + last bit
    return dp;
}

// ── XOR patterns ─────────────────────────────────────────
// Single number — find the one that appears once
int singleNumber(int[] nums) {
    int xorAll = 0;
    for (int n : nums) xorAll ^= n;   // duplicates cancel, singleton remains
    return xorAll;
}

// Missing number in [0..n]
int missingNumber(int[] nums) {
    int xor = nums.length;
    for (int i = 0; i < nums.length; i++) xor ^= i ^ nums[i];
    return xor;
}

// Swap without temp variable
void swapBits(int[] arr, int i, int j) {
    arr[i] ^= arr[j]; arr[j] ^= arr[i]; arr[i] ^= arr[j];
}

// Reverse bits of a 32-bit integer
int reverseBits(int n) {
    int result = 0;
    for (int i = 0; i < 32; i++) {
        result = (result << 1) | (n & 1);
        n >>= 1;
    }
    return result;
}

// Subsets using bits (enumerate all 2^n subsets)
void enumerateSubsets(int[] nums) {
    int n = nums.length;
    for (int mask = 0; mask < (1 << n); mask++) {
        List<Integer> subset = new ArrayList<>();
        for (int i = 0; i < n; i++) if ((mask >> i & 1) == 1) subset.add(nums[i]);
        System.out.println(subset);
    }
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "String Algorithms",
    icon: "∿",
    color: "#8B5CF6",
    desc: "KMP, Rabin-Karp, palindromes, anagram detection, and common string DP problems.",
    topics: [
      {
        n: "KMP, Rabin-Karp, palindromes, anagrams",
        complexity: { time: "KMP O(n+m), Rabin-Karp O(n+m) avg, Manacher O(n)", space: "O(m) KMP, O(1) Manacher" },
        desc: "KMP finds a pattern in a string in O(n+m) using a failure function that avoids re-scanning. Rabin-Karp uses rolling hash for pattern matching. Manacher finds all palindromic substrings in O(n).",
        code: `// ── KMP — O(n+m) pattern search ──────────────────────────
int kmpSearch(String text, String pattern) {
    int n = text.length(), m = pattern.length();
    int[] lps = buildLPS(pattern);  // longest proper prefix-suffix

    int i = 0, j = 0;
    while (i < n) {
        if (text.charAt(i) == pattern.charAt(j)) { i++; j++; }
        if (j == m) return i - j;   // found at index i-j
        else if (i < n && text.charAt(i) != pattern.charAt(j))
            j = j > 0 ? lps[j-1] : ++ i - i; // backtrack j or advance i
    }
    return -1;
}

int[] buildLPS(String p) {
    int m = p.length();
    int[] lps = new int[m];
    int len = 0, i = 1;
    while (i < m) {
        if (p.charAt(i) == p.charAt(len)) lps[i++] = ++len;
        else if (len > 0) len = lps[len - 1];
        else lps[i++] = 0;
    }
    return lps;
}

// ── Rabin-Karp — rolling hash ─────────────────────────────
List<Integer> rabinKarp(String text, String pattern) {
    List<Integer> result = new ArrayList<>();
    int n = text.length(), m = pattern.length();
    long MOD = 1_000_000_007L, BASE = 31;
    long patHash = 0, textHash = 0, power = 1;

    for (int i = 0; i < m - 1; i++) power = power * BASE % MOD;

    for (int i = 0; i < m; i++) {
        patHash  = (patHash * BASE + pattern.charAt(i)) % MOD;
        textHash = (textHash * BASE + text.charAt(i)) % MOD;
    }

    for (int i = 0; i <= n - m; i++) {
        if (textHash == patHash && text.substring(i, i + m).equals(pattern))
            result.add(i);
        if (i < n - m)
            textHash = (textHash - text.charAt(i) * power % MOD + MOD) % MOD;
            textHash = (textHash * BASE + text.charAt(i + m)) % MOD;
    }
    return result;
}

// ── Manacher's — all palindromic substrings in O(n) ───────
int longestPalindromicSubstring(String s) {
    String t = "#" + String.join("#", s.split("")) + "#";
    int n = t.length();
    int[] p = new int[n];
    int c = 0, r = 0, maxLen = 0;
    for (int i = 0; i < n; i++) {
        if (i < r) p[i] = Math.min(r - i, p[2 * c - i]);
        while (i - p[i] - 1 >= 0 && i + p[i] + 1 < n && t.charAt(i-p[i]-1) == t.charAt(i+p[i]+1)) p[i]++;
        if (i + p[i] > r) { c = i; r = i + p[i]; }
        maxLen = Math.max(maxLen, p[i]);
    }
    return maxLen;
}

// ── Anagram check / find all anagrams ────────────────────
boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;
    int[] count = new int[26];
    for (char c : s.toCharArray()) count[c-'a']++;
    for (char c : t.toCharArray()) { if (--count[c-'a'] < 0) return false; }
    return true;
}

List<Integer> findAnagrams(String s, String p) {
    List<Integer> res = new ArrayList<>();
    int[] pCount = new int[26], sCount = new int[26];
    for (char c : p.toCharArray()) pCount[c-'a']++;
    for (int i = 0; i < s.length(); i++) {
        sCount[s.charAt(i)-'a']++;
        if (i >= p.length()) sCount[s.charAt(i-p.length())-'a']--;
        if (Arrays.equals(sCount, pCount)) res.add(i - p.length() + 1);
    }
    return res;
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Math & Number Theory",
    icon: "π",
    color: "#F59E0B",
    desc: "GCD, LCM, Sieve of Eratosthenes, modular arithmetic, fast exponentiation.",
    topics: [
      {
        n: "GCD, LCM, Sieve, Modular Exponentiation",
        complexity: { time: "GCD O(log n), Sieve O(n log log n), ModExp O(log n)", space: "O(n) Sieve" },
        desc: "Euclidean algorithm for GCD. Sieve of Eratosthenes finds all primes up to n in O(n log log n). Modular exponentiation computes a^b mod m in O(log b) — essential for competitive programming.",
        code: `// ── GCD (Euclidean algorithm) ─────────────────────────────
int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }
// Or: Math.gcd(a, b) not in Java stdlib — use above

// ── LCM ───────────────────────────────────────────────────
long lcm(long a, long b) { return a / gcd((int)a, (int)b) * b; }

// ── Check prime ───────────────────────────────────────────
boolean isPrime(int n) {
    if (n < 2) return false;
    if (n < 4) return true;
    if (n % 2 == 0 || n % 3 == 0) return false;
    for (int i = 5; i * i <= n; i += 6)
        if (n % i == 0 || n % (i+2) == 0) return false;
    return true;
}

// ── Sieve of Eratosthenes ─────────────────────────────────
boolean[] sieve(int n) {
    boolean[] isComposite = new boolean[n + 1];
    isComposite[0] = isComposite[1] = true;
    for (int i = 2; i * i <= n; i++)
        if (!isComposite[i])
            for (int j = i * i; j <= n; j += i) isComposite[j] = true;
    return isComposite;
    // isPrime[i] = !isComposite[i]
}

// Count primes up to n
int countPrimes(int n) {
    boolean[] isComposite = sieve(n - 1);
    int count = 0;
    for (int i = 2; i < n; i++) if (!isComposite[i]) count++;
    return count;
}

// ── Modular Exponentiation — a^b mod m ────────────────────
long modPow(long base, long exp, long mod) {
    long result = 1;
    base %= mod;
    while (exp > 0) {
        if ((exp & 1) == 1) result = result * base % mod;  // odd exponent
        base = base * base % mod;
        exp >>= 1;
    }
    return result;
}

// ── Modular inverse (when mod is prime) ──────────────────
long modInverse(long a, long mod) {
    return modPow(a, mod - 2, mod);  // Fermat's little theorem: a^(p-1) ≡ 1 mod p
}

// ── Prime factorization ───────────────────────────────────
Map<Integer, Integer> primeFactors(int n) {
    Map<Integer, Integer> factors = new LinkedHashMap<>();
    for (int i = 2; i * i <= n; i++) {
        while (n % i == 0) { factors.merge(i, 1, Integer::sum); n /= i; }
    }
    if (n > 1) factors.put(n, 1);
    return factors;
}

// ── Pascal's Triangle row (for combinations) ─────────────
int[] pascalRow(int n) {
    int[] row = new int[n + 1];
    row[0] = 1;
    for (int i = 1; i <= n; i++) row[i] = (int)((long) row[i-1] * (n-i+1) / i);
    return row;
}`
      },
    ]
  },
];

export { SECTIONS };

export default function JavaDSA() {
  return (
    <RevisionNotesLayout
      pageKey="dsa"
      title="Java DSA Reference"
      subtitle="Data Structures & Algorithms from arrays to DP with complexity analysis and Java implementations."
      categoryIcon="🔢"
      categoryColor="#F59E0B"
      sections={SECTIONS}
    />
  );
}
