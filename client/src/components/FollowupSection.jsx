import { useMemo, useState } from 'react'

const icons = { search: '⌕', plus: '+', phone: '☎', mail: '✉', calendar: '□', clock: '◷', check: '✓' }

function formatDate(value) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'
  }).format(new Date(value))
}

function toLocalDateTime(value) {
  const date = value ? new Date(value) : new Date(Date.now() + 86400000)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

function FollowupSection({
  items,
  contacts,
  onCreate,
  onUpdateStatus,
  initialContact = '',
  compact = false,
  showScheduleButton = false,
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const visibleItems = useMemo(() => items
    .filter((item) => filter === 'all' || item.status === filter)
    .filter((item) => `${item.contact} ${item.note} ${item.type}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt)),
  [items, filter, query])

  const openNew = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setModalOpen(true)
  }

  const save = (form) => {
    onCreate(form, editing?.id || editing?._id)
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <>
      <div className={compact ? 'followup-section compact' : 'followup-section'}>
        {!compact && (
          <div className="toolbar">
            <div className="search"><span>{icons.search}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search follow-ups..." /></div>
            <div className="filters">
              {[
                ['all', 'All'],
                ['upcoming', 'Upcoming'],
                ['done', 'Done'],
                ['cancelled', 'Cancelled'],
              ].map(([value, label]) => (
                <button key={value} className={filter === value ? 'filter active' : 'filter'} onClick={() => setFilter(value)}>{label}</button>
              ))}
            </div>
          </div>
        )}
        <div className={compact ? 'follow-list compact' : 'follow-list'}>
          {visibleItems.length ? visibleItems.map((item) => {
            const id = item.id || item._id
            const overdue = item.status === 'upcoming' && new Date(item.dueAt) < new Date()
            return (
              <article className="follow-row" key={id}>
                <div className={`type-icon ${item.type}`}>
                  {item.type === 'email' ? icons.mail : item.type === 'meeting' ? icons.calendar : item.type === 'call' ? icons.phone : icons.clock}
                </div>
                <div className="follow-main">
                  <div className="follow-title">
                    <h3>{item.contact}</h3>
                    <span className={`status ${overdue ? 'overdue' : item.status}`}>{overdue ? 'Overdue' : item.status}</span>
                  </div>
                  <p>{item.note}</p>
                  <span className={overdue ? 'due overdue-text' : 'due'}>{icons.calendar} {formatDate(item.dueAt)} · {item.type}</span>
                </div>
                <div className="row-actions">
                  {item.status === 'upcoming' && (
                    <>
                      <button className="done-button" title="Mark done" aria-label="Mark done" onClick={() => onUpdateStatus(id, 'done')}>{icons.check}</button>
                      <button className="more-button" title="Reschedule" aria-label="Reschedule" onClick={() => openEdit(item)}>↻</button>
                      <button className="more-button" title="Cancel follow-up" aria-label="Cancel follow-up" onClick={() => onUpdateStatus(id, 'cancelled')}>×</button>
                    </>
                  )}
                </div>
              </article>
            )
          }) : (
            <div className="empty small"><h3>No matching follow-ups</h3><p>Schedule a reminder to keep this conversation on track.</p></div>
          )}
        </div>
        {(!compact || showScheduleButton) && <button className="primary-button add-followup-button" onClick={openNew}>{icons.plus} Schedule follow-up</button>}
      </div>
      {modalOpen && (
        <FollowupModal
          editing={editing}
          contacts={contacts}
          initialContact={initialContact}
          close={() => { setModalOpen(false); setEditing(null) }}
          save={save}
        />
      )}
    </>
  )
}

function FollowupModal({ editing, contacts, initialContact, close, save }) {
  const [form, setForm] = useState({
    contact: editing?.contact || initialContact || '',
    note: editing?.note || '',
    type: editing?.type || 'call',
    dueAt: toLocalDateTime(editing?.dueAt),
  })

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <form className="modal" onSubmit={(event) => {
        event.preventDefault()
        if (form.contact.trim() && form.note.trim() && form.dueAt) {
          save({ ...form, contact: form.contact.trim(), note: form.note.trim(), dueAt: new Date(form.dueAt).toISOString() })
        }
      }}>
        <div className="modal-heading">
          <div><p className="eyebrow">{editing ? 'RESCHEDULE' : 'NEW REMINDER'}</p><h2>{editing ? 'Reschedule follow-up' : 'Schedule follow-up'}</h2></div>
          <button type="button" className="close-button" onClick={close}>×</button>
        </div>
        <label>Contact
          <input name="contact" list="followup-contacts" value={form.contact} onChange={change} placeholder="Choose a contact" required />
          <datalist id="followup-contacts">{contacts.map((contact) => <option key={contact.id} value={contact.name} />)}</datalist>
        </label>
        <label>Note<textarea name="note" value={form.note} onChange={change} placeholder="What should you follow up about?" required /></label>
        <div className="form-grid">
          <label>Type<select name="type" value={form.type} onChange={change}>
            <option value="call">Call</option><option value="meeting">Meeting</option><option value="email">Email</option><option value="other">Other</option>
          </select></label>
          <label>Schedule for<input name="dueAt" type="datetime-local" value={form.dueAt} onChange={change} required /></label>
        </div>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={close}>Cancel</button><button className="primary-button" type="submit">{editing ? 'Save reschedule' : 'Schedule'}</button></div>
      </form>
    </div>
  )
}

export default FollowupSection
