import { useEffect, useState } from "react";
import supabase from "./supabase.js";
import "./style.css";
import { async } from "q";

function Counter() {
  const [count, setcount] = useState(8);
  return (
    <div>
      <span style={{ fontSize: "40px" }}>{count}</span>
      {/* 如果直接用setcount(值) 只會回傳所設的數值*/}
      <button
        className="btn btn-large"
        onClick={() => setcount((c) => (c += 1))}
      >
        +1
      </button>
    </div>
  );
}

// 裡面不是html是Jsx，自動轉換為JS可以理解的語言，所以class要用className
// JSX元素需字首大寫
//如果要返回多個元素，要用<></>包起來。避免使用div造成不必要的DOM汙染

function App() {
  // [值,函式]=useState();
  const [showForm, setshowFrom] = useState(false);
  const [facts, setFacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currCategory, setCurrCategory] = useState("all");

  //串接supabase API資料
  useEffect(
    function () {
      async function getFacts() {
        //在載入資料前做一個Loading提示
        setIsLoading(true);

        //載入fact資料order by按讚數，Top 100筆
        //篩選類別
        let query = supabase.from("facts").select("*");
        if (currCategory !== "all") query = query.eq("category", currCategory);

        const { data: facts, error } = await query
          .order("votesInteresting", { ascending: false })
          .limit(100);

        //載入資料有誤跳提示
        if (!error) setFacts(facts);
        else alert("There was a problem getting data");
        setIsLoading(false);
      }
      getFacts();
    },
    //currCategory要放入這邊才會重新加載
    [currCategory]
  );

  return (
    <>
      <Header setshowFrom={setshowFrom} showForm={showForm} />

      {/* FROM顯示與否 */}
      {showForm ? (
        <NewFactForm setFacts={setFacts} setshowFrom={setshowFrom} />
      ) : null}

      <main className="main">
        <CategoryFilter setCurrCategory={setCurrCategory} />
        {isLoading ? (
          <Loader />
        ) : (
          <FactList facts={facts} setFacts={setFacts} />
        )}
      </main>
    </>
  );
}

function Loader() {
  return <p className="message">Loading...</p>;
}

function Header({ showForm, setshowFrom }) {
  const appTitle = "today i learning";
  return (
    // HEADER
    <header className="header">
      <div className="logo">
        <img src="logo.png" height="68" width="68" alt="Logo" />
        <h1>{appTitle}</h1>
      </div>
      <button
        className="btn btn-large btn-open"
        onClick={() => setshowFrom((show) => !show)}
      >
        {/* 變更文字 */}
        {showForm ? "close" : "share a fact"}
      </button>
    </header>
  );
}

const CATEGORIES = [
  { name: "technology", color: "#3b82f6" },
  { name: "science", color: "#16a34a" },
  { name: "finance", color: "#ef4444" },
  { name: "society", color: "#eab308" },
  { name: "entertainment", color: "#db2777" },
  { name: "health", color: "#14b8a6" },
  { name: "history", color: "#f97316" },
  { name: "news", color: "#8b5cf6" },
];

//驗證URL
function isValidURLUsingURLAPI(url) {
  try {
    // 嘗試建立一個 URL 物件
    new URL(url);
    return true;
  } catch (e) {
    // 如果構造函數拋出錯誤，則表示 URL 無效
    return false;
  }
}

function NewFactForm({ setFacts, setshowFrom }) {
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [category, setCategory] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const textLength = text.length;

  async function handleSubmit(e) {
    // 1. 阻止瀏覽器重新載入
    e.preventDefault();
    console.log(text, source, category);

    // 2. 檢查資料是否有效。如果有效，則建立一個新的事實
    if (
      text &&
      isValidURLUsingURLAPI(source) &&
      category &&
      textLength <= 200
    ) {
      // // 3. 建立一個新的事實物件
      // const newFact = {
      //   id: Math.round(Math.random() * 10000000),
      //   text,
      //   source,
      //   category,
      //   votesInteresting: 0,
      //   votesMindblowing: 0,
      //   votesFalse: 0,
      //   createdIn: new Date().getFullYear(),
      // };

      //  3. 上傳事實到supabase & 接收新事實物件
      setIsUploading(true);
      const { data: newFact, error } = await supabase
        .from("facts")
        .insert([{ text, source, category }])
        .select();
      setIsUploading(false);

      // 4. 將新的事實新增到使用者介面：將事實新增到state
      if (!error) setFacts((facts) => [newFact[0], ...facts]);

      // 5. 重設輸入欄位
      setText("");
      setSource("");
      setCategory("");

      // 6. 關閉表單
      setshowFrom(false);
    }
  }

  return (
    <form className="fact-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Share a fact with the world..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isUploading}
      />
      <span>{200 - textLength}</span>
      <input
        type="text"
        placeholder="Trustworthy source..."
        value={source}
        onChange={(e) => setSource(e.target.value)}
        disabled={isUploading}
      />

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        disabled={isUploading}
      >
        <option value="">Choose category:</option>
        {CATEGORIES.map((cat) => (
          <option key={cat.name} value={cat.name}>
            {cat.name.toUpperCase()}
          </option>
        ))}
      </select>

      <button className="btn btn-large" disabled={isUploading}>
        Post
      </button>
    </form>
  );
}

function CategoryFilter({ setCurrCategory }) {
  return (
    <aside>
      <ul>
        <li className="category">
          <button
            className="btn btn-all-categorise"
            onClick={() => setCurrCategory("all")}
          >
            All
          </button>
        </li>
        {CATEGORIES.map((category) => (
          <li key={category.name} className="category">
            <button
              className="btn btn-category"
              style={{ backgroundColor: category.color }}
              onClick={() => setCurrCategory(category.name)}
            >
              {category.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function FactList({ facts, setFacts }) {
  if (facts.length === 0) {
    return (
      <p className="message">
        No facts for this category yet! Create the first one 😊
      </p>
    );
  }

  return (
    <section>
      <ul className="facts-list">
        {facts.map((fact) => (
          <Fact key={fact.id} fact={fact} setFacts={setFacts} />
        ))}
      </ul>
      <p>There are {facts.length} Facts in database. Add your own!</p>
    </section>
  );
}

// props
function Fact({ fact, setFacts }) {
  // isUpdating 狀態：用於追蹤投票操作是否正在進行中。
  // 當為 true 時，可禁用按鈕以防止重複點擊或顯示載入指示。
  const [isUpdating, setIsUpdating] = useState(false);

  const isDisputed =
    fact.votesInteresting + fact.votesMindblowing < fact.votesFalse;

  // handleVote 函式：非同步函式，負責處理投票邏輯。
  async function handleVote(columnName) {
    // 步驟 1: 開始投票更新，將 isUpdating 設為 true。
    setIsUpdating(true);

    // 步驟 2: 向 Supabase 數據庫發送更新請求。
    const { data: updateFact, error } = await supabase
      .from("facts") // 指定操作名為 "facts" 的資料表。
      .update({ [columnName]: fact[columnName] + 1 })
      // 使用計算屬性名 [columnName] 來動態指定要更新的欄位。
      // 該欄位的值會是目前 fact 物件中該欄位的值加 1。
      .eq("id", fact.id) // 根據目前 fact 物件的 id 來精確指定要更新哪一條記錄。
      .select(); // 在更新後，返回被更新的那條記錄的最新資料。
    // 步驟 3: 投票更新完成 (無論成功或失敗)，將 isUpdating 設為 false。
    setIsUpdating(false);

    // 步驟 4: 如果數據庫操作沒有錯誤 (更新成功)。
    if (!error)
      // 使用 setFacts 函式更新 React 狀態中「所有事實」的陣列。
      setFacts((facts) =>
        // 遍歷當前所有事實的陣列 (facts)。
        facts.map((f) =>
          // 如果陣列中的事實 (f) 的 id 與我們剛剛更新的事實 (fact) 的 id 相同，
          // 則用從數據庫返回的最新資料 (updateFact[0]) 替換它。
          // 否則，保持原樣 (f)。
          f.id === fact.id ? updateFact[0] : f
        )
      );
  }

  return (
    <li className="fact">
      <p>
        {isDisputed ? <span className="disputed">[⛔DISPUTED]</span> : null}
        {fact.text}
        <a className="source" href={fact.source} target="_blank">
          (Source)
        </a>
      </p>
      <span
        className="tag"
        style={{
          backgroundColor: CATEGORIES.find(
            (category) => category.name === fact.category
          ).color,
        }}
      >
        {fact.category}
      </span>
      <div className="vote-buttons">
        <button
          onClick={() => handleVote("votesInteresting")}
          disabled={isUpdating}
        >
          👍{fact.votesInteresting}
        </button>
        <button
          onClick={() => handleVote("votesMindblowing")}
          disabled={isUpdating}
        >
          🤯{fact.votesMindblowing}
        </button>
        <button onClick={() => handleVote("votesFalse")} disabled={isUpdating}>
          ⛔️{fact.votesFalse}
        </button>
      </div>
    </li>
  );
}

export default App;
