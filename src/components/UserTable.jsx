import { useEffect, useState, useMemo } from "react";
import './UserTable.css';

const columns = [
    { key: "lastName", label: "Last Name", sortable: true },
    { key: "firstName", label: "First Name", sortable: true },
    { key: "maidenName", label: "Maiden Name", sortable: true },
    { key: "age", label: "Age", sortable: true },
    { key: "gender", label: "Gender", sortable: true },
    { key: "phone", label: "Phone", sortable: true },
    { key: "email", label: "Email", sortable: false },
    { key: "country", label: "Country", sortable: false },
    { key: "city", label: "City", sortable: false },
];

const sortIcons = {
    none: '',
    asc: '▲',
    desc: '▼',
};

function getNextSortOrder(current) {
    if (current === 'none') return 'asc';
    if (current === 'asc') return 'desc';
    return 'none';
}

function UserModal({ user, onClose }) {
    if (!user) return null;
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={onClose}>
            <div style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 320, maxWidth: 400, position: 'relative' }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={{ position: 'absolute', top: 8, right: 8, fontSize: 18, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <img src={user.image} alt="avatar" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', marginBottom: 8 }} />
                    <h2 style={{ margin: 0 }}>{user.lastName} {user.firstName} {user.maidenName}</h2>
                    <div style={{ color: '#888', fontSize: 14 }}>{user.email}</div>
                </div>
                <div><b>Age:</b> {user.age}</div>
                <div><b>Gender:</b> {user.gender}</div>
                <div><b>Phone:</b> {user.phone}</div>
                <div><b>Height:</b> {user.height} cm</div>
                <div><b>Weight:</b> {user.weight} kg</div>
                <div><b>Address:</b> {user.address?.country || user.address?.страна}, {user.address?.city || user.address?.город}, {user.address?.address}</div>
            </div>
        </div>
    );
}

function UserTable() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = useState('none');
    const [filters, setFilters] = useState({
        lastName: '',
        firstName: '',
        maidenName: '',
        age: '',
        gender: '',
        phone: '',
    });
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [modalUser, setModalUser] = useState(null);
    const [columnWidths, setColumnWidths] = useState(() => columns.reduce((acc, col) => {
        acc[col.key] = 120;
        return acc;
    }, {}));
    const [resizing, setResizing] = useState({});

    const handleMouseDown = (e, colKey, nextColKey) => {
        setResizing({
            leftCol: colKey,
            rightCol: nextColKey,
            startX: e.clientX,
            startLeftWidth: columnWidths[colKey],
            startRightWidth: columnWidths[nextColKey],
        });
    };

    useEffect(() => {
        if (!resizing.leftCol || !resizing.rightCol) return;
        const handleMouseMove = (e) => {
            const delta = e.clientX - resizing.startX;
            let newLeft = Math.max(50, resizing.startLeftWidth + delta);
            let newRight = Math.max(50, resizing.startRightWidth - delta);
            if (resizing.startLeftWidth + delta < 50) {
                newLeft = 50;
                newRight = resizing.startLeftWidth + resizing.startRightWidth - 50;
            } else if (resizing.startRightWidth - delta < 50) {
                newRight = 50;
                newLeft = resizing.startLeftWidth + resizing.startRightWidth - 50;
            }
            setColumnWidths((prev) => ({
                ...prev,
                [resizing.leftCol]: newLeft,
                [resizing.rightCol]: newRight,
            }));
        };
        const handleMouseUp = () => setResizing({});
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizing]);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch("https://dummyjson.com/users?limit=50");
                if (!res.ok) throw new Error("Failed to load users");
                const data = await res.json();
                setUsers(data.users);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleSort = (key) => {
        if (!columns.find((col) => col.key === key).sortable) return;
        if (sortField !== key) {
            setSortField(key);
            setSortOrder('asc');
        } else {
            setSortOrder(getNextSortOrder(sortOrder));
            if (getNextSortOrder(sortOrder) === 'none') setSortField(null);
        }
    };

    const handleFilterChange = (e, key) => {
        setFilters((prev) => ({ ...prev, [key]: e.target.value }));
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const lastName = (user.lastName || '').toLowerCase();
            const firstName = (user.firstName || '').toLowerCase();
            const maidenName = (user.maidenName || '').toLowerCase();
            if (filters.lastName && !lastName.includes(filters.lastName.toLowerCase())) return false;
            if (filters.firstName && !firstName.includes(filters.firstName.toLowerCase())) return false;
            if (filters.maidenName && !maidenName.includes(filters.maidenName.toLowerCase())) return false;
            if (filters.age && String(user.age) !== filters.age) return false;
            if (filters.gender && user.gender !== filters.gender) return false;
            if (filters.phone && !String(user.phone).toLowerCase().includes(filters.phone.toLowerCase())) return false;
            return true;
        });
    }, [users, filters]);

    const sortedUsers = useMemo(() => {
        if (!sortField || sortOrder === 'none') return filteredUsers;
        return [...filteredUsers].sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];
            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            return 0;
        });
    }, [filteredUsers, sortField, sortOrder]);

    const totalPages = sortedUsers.length === 0 ? 0 : Math.ceil(sortedUsers.length / pageSize);
    useEffect(() => {
        if (page > totalPages) setPage(totalPages || 1);
    }, [totalPages, page]);
    const pagedUsers = useMemo(() => {
        if (sortedUsers.length === 0) return [];
        const start = (page - 1) * pageSize;
        return sortedUsers.slice(start, start + pageSize);
    }, [sortedUsers, page, pageSize]);

    useEffect(() => {
        setPage(1);
    }, [filters, sortField, sortOrder]);

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        setPage(newPage);
    };

    return (
        <div className="user-table-wrapper notranslate">
            {loading && <div className="user-table-loading">Loading...</div>}
            {error && <div className="user-table-error">{error}</div>}
            {!loading && !error && (
                <>
                    <table className="user-table">
                        <colgroup>
                            {columns.map((col) => (
                                <col key={col.key} style={{ width: columnWidths[col.key] }} />
                            ))}
                        </colgroup>
                        <thead>
                            <tr>
                                {columns.map((col, idx) => (
                                    <th
                                        key={col.key}
                                        className={col.sortable ? 'sortable' : ''}
                                        style={{ minWidth: 50, userSelect: 'none', cursor: col.sortable ? 'pointer' : 'default', position: 'relative' }}
                                        onClick={() => handleSort(col.key)}
                                    >
                                        {idx > 0 && (
                                            <div
                                                onMouseDown={e => handleMouseDown(e, columns[idx - 1].key, col.key)}
                                                className="col-resizer col-resizer-left"
                                                onClick={e => e.stopPropagation()}
                                                style={{ left: 0, position: 'absolute', top: 0, height: '100%', width: 6, zIndex: 2 }}
                                            />
                                        )}
                                        {col.label} {col.sortable && sortField === col.key && sortIcons[sortOrder]}
                                        {idx < columns.length - 1 && (
                                            <div
                                                onMouseDown={e => handleMouseDown(e, col.key, columns[idx + 1].key)}
                                                className="col-resizer col-resizer-right"
                                                onClick={e => e.stopPropagation()}
                                                style={{ right: 0, position: 'absolute', top: 0, height: '100%', width: 6, zIndex: 2 }}
                                            />
                                        )}
                                    </th>
                                ))}
                            </tr>
                            <tr>
                                {columns.map((col) => {
                                    if (col.key === 'lastName') {
                                        return (
                                            <th key={col.key}>
                                                <input
                                                    className="no-border"
                                                    type="text"
                                                    placeholder="Last Name"
                                                    value={filters.lastName}
                                                    onChange={(e) => handleFilterChange(e, 'lastName')}
                                                />
                                            </th>
                                        );
                                    }
                                    if (col.key === 'firstName') {
                                        return (
                                            <th key={col.key}>
                                                <input
                                                    className="no-border"
                                                    type="text"
                                                    placeholder="First Name"
                                                    value={filters.firstName}
                                                    onChange={(e) => handleFilterChange(e, 'firstName')}
                                                />
                                            </th>
                                        );
                                    }
                                    if (col.key === 'maidenName') {
                                        return (
                                            <th key={col.key}>
                                                <input
                                                    className="no-border"
                                                    type="text"
                                                    placeholder="Maiden Name"
                                                    value={filters.maidenName}
                                                    onChange={(e) => handleFilterChange(e, 'maidenName')}
                                                />
                                            </th>
                                        );
                                    }
                                    if (col.key === 'age') {
                                        return (
                                            <th key={col.key}>
                                                <input
                                                    className="no-border"
                                                    type="number"
                                                    placeholder="Age"
                                                    value={filters.age}
                                                    onChange={(e) => handleFilterChange(e, 'age')}
                                                    min={0}
                                                />
                                            </th>
                                        );
                                    }
                                    if (col.key === 'gender') {
                                        return (
                                            <th key={col.key}>
                                                <select
                                                    className="no-border"
                                                    value={filters.gender}
                                                    onChange={(e) => handleFilterChange(e, 'gender')}
                                                >
                                                    <option value="">Gender</option>
                                                    <option value="male">male</option>
                                                    <option value="female">female</option>
                                                </select>
                                            </th>
                                        );
                                    }
                                    if (col.key === 'phone') {
                                        return (
                                            <th key={col.key}>
                                                <input
                                                    className="no-border"
                                                    type="text"
                                                    placeholder="Phone"
                                                    value={filters.phone}
                                                    onChange={(e) => handleFilterChange(e, 'phone')}
                                                />
                                            </th>
                                        );
                                    }
                                    return <th key={col.key} />;
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {pagedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="user-table-empty">No data</td>
                                </tr>
                            ) : (
                                pagedUsers.map((user) => (
                                    <tr key={user.id} className="user-table-row" onClick={() => setModalUser(user)}>
                                        <td>{user.lastName}</td>
                                        <td>{user.firstName}</td>
                                        <td>{user.maidenName}</td>
                                        <td>{user.age}</td>
                                        <td>{user.gender}</td>
                                        <td>{user.phone}</td>
                                        <td>{user.email}</td>
                                        <td>{user.address?.country || user.address?.страна}</td>
                                        <td>{user.address?.city || user.address?.город}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    <div className="user-table-pagination notranslate">
                        <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
                            Back
                        </button>
                        <span>Page <span className="user-table-page-num">{page}</span> of <span className="user-table-page-num">{totalPages}</span></span>
                        <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
                            Next
                        </button>
                    </div>
                    <UserModal user={modalUser} onClose={() => setModalUser(null)} />
                </>
            )}
        </div>
    );
}

export default UserTable; 