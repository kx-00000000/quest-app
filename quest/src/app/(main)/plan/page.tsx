// 削除ボタンの横にアーカイブボタンを追加
<div className="absolute top-7 right-7 flex gap-4 z-20">
    <button
        onClick={() => handleArchive(plan.id)} // アーカイブ関数を呼ぶ
        className="text-gray-300 hover:text-orange-400 transition-colors"
    >
        <Package size={18} strokeWidth={2.5} />
    </button>
    <button
        onClick={() => handleDelete(plan.id)}
        className="text-gray-300 hover:text-red-400 transition-colors"
    >
        <Trash2 size={18} strokeWidth={2.5} />
    </button>
</div>