
export type Post={
    id: number
    title: string
    body: string
}

export async function fetchPosts(): Promise<Post[]>{
    //_limit=5 只取前 5 筆
    const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5")

    if(!response.ok){
        throw new Error("Network response was not ok")
    }

    return await response.json()
}