//一篇post
//HW6似乎用不到了
type PostProps ={
    title : string
    body : string
}

export default function Post({title, body}: PostProps){
    return (
        //margin-bottom, shadow-sm → 小陰影
        <div className="Card mb-3 shadow-sm">
            <div className="card-body">
                <h5 className="card-title">{title}</h5>
                <p className="card-text">{body}</p>
            </div>
        </div>
    )
}