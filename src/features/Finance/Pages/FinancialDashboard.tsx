import React, { useEffect, useMemo, useState } from 'react';
import api from '@/core/api/client';
import { extractList } from '@/core/api/extractData';
import Pagination from '@/core/Components/Pagination';
import Skeleton from '@/core/Components/Skeleton';
import { useSearchParams } from 'react-router-dom';
import './FinancialDashboard.css';

type PaymentStatus = 'completed' | 'pending' | 'failed';
type SplitMode = 'single' | 'installment';

type Transaction = {
  id: string;
  initials: string;
  student: string;
  studentCode: string;
  className: string;
  feeType: string;
  amountUsd: number;
  amountCdf: number;
  dateLabel: string;
  method: string;
  status: PaymentStatus;
};

type InstallmentRow = {
  id: number;
  payment_plan_id: number;
  installment_number: number;
  amount_due: number;
  amount_paid: number;
  status: 'pending' | 'partial' | 'completed';
  due_date?: string;
  student_name: string;
  fee_label: string;
};

const exchangeRate = 2850;

const FinancialDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const studentIdFilter = searchParams.get('studentId') || '';
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [students, setStudents] = useState<Array<{ id: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('Especes');
  const [splitMode, setSplitMode] = useState<SplitMode>('single');
  const [installmentsCount, setInstallmentsCount] = useState(3);
  const [installments, setInstallments] = useState<InstallmentRow[]>([]);
  const [feeTypes, setFeeTypes] = useState<Array<{ id: number; code: string; label: string }>>([]);
  const [formData, setFormData] = useState({
    studentId: studentIdFilter || '',
    feeTypeId: '',
    currency: 'USD',
    amount: '',
    note: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [paymentsRes, configRes, plansRes] = await Promise.all([
          api.get('/api/payments', {
            params: studentIdFilter ? { student_id: studentIdFilter } : undefined,
          }),
          api.get('/api/finance/config').catch(() => null),
          api.get('/api/payment-plans', {
            params: studentIdFilter ? { student_id: studentIdFilter } : undefined,
          }).catch(() => null),
        ]);

        const mappedTransactions: Transaction[] = extractList<any>(paymentsRes).map((payment: any) => {
          const firstName = payment.student?.first_name ?? 'Eleve';
          const lastName = payment.student?.last_name ?? `#${payment.student_id ?? ''}`;
          const fullName = `${firstName} ${lastName}`.trim();
          const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
          const amountValue = Number(payment.amount) || 0;
          const isUsd = payment.currency === 'USD';
          const paidDate = payment.paid_at || payment.created_at;

          return {
            id: String(payment.id),
            initials,
            student: fullName,
            studentCode: payment.student?.matricule || String(payment.student_id ?? '-'),
            className: payment.student?.school_class?.name || 'Classe N/A',
            feeType: payment.type || 'Frais',
            amountUsd: isUsd ? amountValue : amountValue / exchangeRate,
            amountCdf: isUsd ? amountValue * exchangeRate : amountValue,
            dateLabel: paidDate ? new Date(paidDate).toLocaleString('fr-FR') : '-',
            method: payment.payment_method || selectedMethod,
            status: payment.status || 'pending',
          };
        });

        setTransactions(mappedTransactions);
        const backendFeeTypes = configRes?.data?.fee_types || [];
        setFeeTypes(backendFeeTypes);
        if (backendFeeTypes.length) {
          setFormData((prev) => ({ ...prev, feeTypeId: prev.feeTypeId || String(backendFeeTypes[0].id) }));
        }

        const rows = extractList<any>(plansRes || { data: [] }).flatMap((plan: any) =>
          (plan.installments || []).map((ins: any) => ({
            id: Number(ins.id),
            payment_plan_id: Number(plan.id),
            installment_number: Number(ins.installment_number),
            amount_due: Number(ins.amount_due || 0),
            amount_paid: Number(ins.amount_paid || 0),
            status: ins.status || 'pending',
            due_date: ins.due_date,
            student_name: `${plan.student?.first_name || ''} ${plan.student?.last_name || ''}`.trim(),
            fee_label: plan.fee_type?.label || plan.fee_type?.code || 'Frais',
          }))
        );
        setInstallments(rows);
      } catch (error) {
        console.error('Erreur chargement finance:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [studentIdFilter]);

  useEffect(() => {
    const loadStudentsForDrawer = async () => {
      if (!isDrawerOpen || studentsLoaded) {
        return;
      }
      try {
        const studentsRes = await api.get('/api/students', { params: { per_page: 100 } });
        const mappedStudents = extractList<any>(studentsRes).map((s: any) => ({
          id: String(s.id),
          label: `${s.first_name} ${s.last_name} (${s.matricule || s.id})`,
        }));
        setStudents(mappedStudents);
        setStudentsLoaded(true);
      } catch (error) {
        console.error('Erreur chargement eleves finance:', error);
      }
    };
    loadStudentsForDrawer();
  }, [isDrawerOpen, studentsLoaded]);

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return transactions;
    }
    return transactions.filter(
      (tx) =>
        tx.student.toLowerCase().includes(q) ||
        tx.studentCode.toLowerCase().includes(q) ||
        tx.feeType.toLowerCase().includes(q)
    );
  }, [transactions, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, transactions.length]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);

  const stats = useMemo(() => {
    const paidThisMonth = transactions
      .filter((tx) => tx.status === 'completed')
      .reduce((sum, tx) => sum + tx.amountUsd, 0);
    const dueAmount = transactions
      .filter((tx) => tx.status !== 'completed')
      .reduce((sum, tx) => sum + tx.amountUsd, 0);
    const globalBalance = transactions.reduce((sum, tx) => sum + tx.amountUsd, 0);

    return {
      paidThisMonth,
      dueAmount,
      globalBalance,
    };
  }, [transactions]);

  const onSavePayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.studentId || !formData.amount) {
      alert('Veuillez renseigner eleve et montant.');
      return;
    }

    try {
      const method = selectedMethod.toLowerCase().includes('especes')
        ? 'cash'
        : selectedMethod.toLowerCase().includes('banque')
        ? 'bank_transfer'
        : 'mobile_money';
      const feeCode = feeTypes.find((f) => String(f.id) === formData.feeTypeId)?.code || 'tuition';

      if (splitMode === 'single') {
        await api.post('/api/payments', {
          student_id: formData.studentId,
          amount: Number(formData.amount),
          currency: formData.currency,
          type: feeCode,
          payment_method: method,
          due_date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: formData.note || null,
        });
      } else {
        const total = Number(formData.amount);
        const part = total / Math.max(installmentsCount, 1);
        const data = Array.from({ length: installmentsCount }).map((_, index) => ({
          amount_due: Number(part.toFixed(2)),
          due_date: new Date(new Date().setMonth(new Date().getMonth() + index)).toISOString().split('T')[0],
        }));
        await api.post('/api/payment-plans', {
          student_id: formData.studentId,
          fee_type_id: Number(formData.feeTypeId),
          academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
          currency: formData.currency,
          total_amount: total,
          installments: data,
          notes: formData.note || null,
        });
      }

      const refreshed = await api.get('/api/payments');
      const mappedTransactions: Transaction[] = extractList<any>(refreshed).map((payment: any) => {
        const firstName = payment.student?.first_name ?? 'Eleve';
        const lastName = payment.student?.last_name ?? `#${payment.student_id ?? ''}`;
        const fullName = `${firstName} ${lastName}`.trim();
        const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
        const amountValue = Number(payment.amount) || 0;
        const isUsd = payment.currency === 'USD';
        const paidDate = payment.paid_at || payment.created_at;

        return {
          id: String(payment.id),
          initials,
          student: fullName,
          studentCode: payment.student?.matricule || String(payment.student_id ?? '-'),
          className: payment.student?.school_class?.name || 'Classe N/A',
          feeType: payment.type || 'Frais',
          amountUsd: isUsd ? amountValue : amountValue / exchangeRate,
          amountCdf: isUsd ? amountValue * exchangeRate : amountValue,
          dateLabel: paidDate ? new Date(paidDate).toLocaleString('fr-FR') : '-',
          method: payment.payment_method || selectedMethod,
          status: payment.status || 'pending',
        };
      });
      setTransactions(mappedTransactions);

      setIsDrawerOpen(false);
      setFormData({
        studentId: studentIdFilter || '',
        feeTypeId: feeTypes[0] ? String(feeTypes[0].id) : '',
        currency: 'USD',
        amount: '',
        note: '',
      });
      setSelectedMethod('Especes');
      setSplitMode('single');
    } catch (error) {
      console.error('Erreur creation paiement:', error);
      alert("Erreur lors de l'enregistrement du paiement.");
    }
  };

  const onPayInstallment = async (row: InstallmentRow) => {
    try {
      await api.post(`/api/payment-installments/${row.id}/pay`, {
        amount: row.amount_due - row.amount_paid,
        payment_method: 'cash',
      });
      const plansRes = await api.get('/api/payment-plans', {
        params: studentIdFilter ? { student_id: studentIdFilter } : undefined,
      });
      const rows = extractList<any>(plansRes).flatMap((plan: any) =>
        (plan.installments || []).map((ins: any) => ({
          id: Number(ins.id),
          payment_plan_id: Number(plan.id),
          installment_number: Number(ins.installment_number),
          amount_due: Number(ins.amount_due || 0),
          amount_paid: Number(ins.amount_paid || 0),
          status: ins.status || 'pending',
          due_date: ins.due_date,
          student_name: `${plan.student?.first_name || ''} ${plan.student?.last_name || ''}`.trim(),
          fee_label: plan.fee_type?.label || plan.fee_type?.code || 'Frais',
        }))
      );
      setInstallments(rows);
    } catch (error) {
      console.error('Erreur paiement tranche:', error);
      alert("Impossible d'encaisser la tranche.");
    }
  };

  if (loading) {
    return (
      <div className="finance-redesign-page">
        <Skeleton className="skel-h-24" />
        <Skeleton className="skel-h-24" />
        <Skeleton className="skel-h-24" />
      </div>
    );
  }

  return (
    <div className="finance-redesign-page">
      <section className="finance-kpis">
        <div className="balance-card">
          <div>
            <h2>Solde scolaire 2023-24</h2>
            <div className="balance-amount">
              <span>{stats.globalBalance.toLocaleString()}</span>
              <small>USD</small>
            </div>
            <p>
              <span className="material-symbols-outlined">trending_up</span>
              +12% par rapport au mois dernier
            </p>
          </div>
          <span className="material-symbols-outlined bg-icon">account_balance_wallet</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-head">
            <span className="material-symbols-outlined success">check_circle</span>
            <strong>+4.2k</strong>
          </div>
          <h3>Paye ce mois</h3>
          <p>{stats.paidThisMonth.toLocaleString()} USD</p>
        </div>

        <div className="kpi-card">
          <div className="kpi-head">
            <span className="material-symbols-outlined danger">pending</span>
            <strong className="danger-text">-1.8k</strong>
          </div>
          <h3>Restant du</h3>
          <p>{stats.dueAmount.toLocaleString()} USD</p>
        </div>
      </section>

      <section className="transactions-card">
        <header className="transactions-header">
          <div>
            <h3>Échéancier des tranches</h3>
            <p>Suivi des paiements partiels par élève</p>
          </div>
        </header>
        <div className="transactions-table-wrap">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Élève</th>
                <th>Frais</th>
                <th>Tranche</th>
                <th>Échéance</th>
                <th>Payé / Dû</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {installments.map((row) => (
                <tr key={row.id}>
                  <td>{row.student_name || '-'}</td>
                  <td>{row.fee_label}</td>
                  <td>#{row.installment_number}</td>
                  <td>{row.due_date ? new Date(row.due_date).toLocaleDateString('fr-FR') : '-'}</td>
                  <td>
                    {row.amount_paid.toFixed(2)} / {row.amount_due.toFixed(2)}
                  </td>
                  <td>{row.status}</td>
                  <td>
                    {row.status !== 'completed' && (
                      <button className="btn-outline" onClick={() => onPayInstallment(row)}>
                        Encaisser
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="transactions-card">
        <header className="transactions-header">
          <div>
            <h3>Transactions recentes</h3>
            <p>
              Suivi en temps reel des encaissements scolaires
              {studentIdFilter ? ` - filtre eleve #${studentIdFilter}` : ''}
            </p>
          </div>
          <div className="header-actions">
            <div className="search-field">
              <span className="material-symbols-outlined">search</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une transaction, un eleve..."
              />
            </div>
            <button className="btn-outline">
              <span className="material-symbols-outlined">filter_list</span>
              Filtrer
            </button>
            <button className="btn-primary" onClick={() => setIsDrawerOpen(true)}>
              <span className="material-symbols-outlined">add</span>
              Nouveau Paiement
            </button>
          </div>
        </header>

        <div className="transactions-table-wrap">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Élève</th>
                <th>Type</th>
                <th>Montant</th>
                <th>Date</th>
                <th>Methode</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td>
                    <div className="student-row">
                      <div className="student-avatar">{tx.initials}</div>
                      <div>
                        <p>{tx.student}</p>
                        <small>
                          ID: {tx.studentCode} - {tx.className}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>{tx.feeType}</td>
                  <td>
                    <strong>{tx.amountUsd.toFixed(2)} USD</strong>
                    <small>{tx.amountCdf.toLocaleString()} CDF</small>
                  </td>
                  <td>{tx.dateLabel}</td>
                  <td>{tx.method}</td>
                  <td>
                    <span className={`status ${tx.status}`}>
                      {tx.status === 'completed'
                        ? 'Complete'
                        : tx.status === 'pending'
                        ? 'En attente'
                        : 'Echoue'}
                    </span>
                  </td>
                  <td className="actions">
                    <button>
                      <span className="material-symbols-outlined">receipt_long</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="transactions-footer">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredTransactions.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </footer>
      </section>

      <div className={`payment-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)} />
        <aside className="drawer-panel">
          <div className="drawer-header">
            <div>
              <h3>Enregistrer un Paiement</h3>
              <p>Remplissez les informations ci-dessous</p>
            </div>
            <button onClick={() => setIsDrawerOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form className="drawer-body" onSubmit={onSavePayment}>
            <label>
              Rechercher l eleve
              <select
                value={formData.studentId}
                onChange={(e) => setFormData((prev) => ({ ...prev, studentId: e.target.value }))}
              >
                <option value="">Selectionner un eleve</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="drawer-grid">
              <label>
                Type de frais
                <select
                  value={formData.feeTypeId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, feeTypeId: e.target.value }))}
                >
                  {feeTypes.map((fee) => (
                    <option key={fee.id} value={fee.id}>
                      {fee.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Devise
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
                >
                  <option>USD</option>
                  <option>CDF</option>
                </select>
              </label>
            </div>

            <label>
              Montant
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
              />
            </label>

            <div className="drawer-grid">
              <label>
                Mode de paiement
                <select value={splitMode} onChange={(e) => setSplitMode(e.target.value as SplitMode)}>
                  <option value="single">Paiement en une fois</option>
                  <option value="installment">Paiement par tranche</option>
                </select>
              </label>
              {splitMode === 'installment' && (
                <label>
                  Nombre de tranches
                  <input
                    type="number"
                    min={2}
                    max={12}
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                  />
                </label>
              )}
            </div>

            <div>
              <p className="sub-label">Methode de Paiement</p>
              <div className="method-grid">
                {['Especes', 'M-Pesa', 'Orange Money', 'Banque'].map((method) => (
                  <label key={method} className={selectedMethod === method ? 'active' : ''}>
                    <input
                      type="radio"
                      checked={selectedMethod === method}
                      onChange={() => setSelectedMethod(method)}
                    />
                    <span>{method}</span>
                  </label>
                ))}
              </div>
            </div>

            <label>
              Note / Reference
              <textarea
                rows={3}
                value={formData.note}
                onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Optionnel..."
              />
            </label>

            <div className="drawer-info">
              <span className="material-symbols-outlined">info</span>
              <p>
                La transaction sera validee immediatement et un recu numerique sera genere pour l eleve.
              </p>
            </div>

            <div className="drawer-footer">
              <button type="button" className="cancel" onClick={() => setIsDrawerOpen(false)}>
                Annuler
              </button>
              <button type="submit" className="confirm">
                Confirmer
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
};

export default FinancialDashboard;
