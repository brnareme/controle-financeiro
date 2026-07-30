Chart.register(ChartDataLabels);

        const categories = {
            expense: [
                "Farmácia",
                //"Outros",
                "Compras",
                "Repasse Lavanderia",
                "Comida",
                "Diarista",
                "Telefone",
                "Mercado",
                "Entretenimento",
                "IFood",
                "Educação",
                "Beleza",
                "Esportes",
                "Social",
                "Transporte",
                "Roupas",
                "Carro",
                "Bebidas",
                "Cigarros",
                "Eletrônicos",
                "Viagem",
                "Saúde",
                "Pets",
                "Reparos",
                "Moradia",
                "Lar",
                "Presentes",
                "Doações",
                "Loteria",
                "Lanches",
                "Filhos",
                "Vegetais",
                "Frutas",
                //"Configuração"
            ],

            income: [
                "Salário",
                "Renda Extra",
                "Vendas",
                "Reembolso",
                "Investimentos",
                //"Outros"
            ]
        };

        const CUSTOM_CATEGORIES_KEY = "app_custom_categories";

        let customCategories = JSON.parse(
            localStorage.getItem(CUSTOM_CATEGORIES_KEY)
        ) || {
            expense: [],
            income: []
        };

        let transactions = JSON.parse(localStorage.getItem("app_transactions")) || [];
        let chartInstance = null;

        // Configurar datas padrões (Mês Atual)
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        
        document.getElementById('date').valueAsDate = now;
        document.getElementById('startDate').value = firstDay;
        document.getElementById('endDate').value = lastDay;

        updateCategories();
        initFilterCategories();
        renderDashboard();

        function switchTab(tabId, btn) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            
            document.getElementById(tabId).classList.add('active');
            btn.classList.add('active');

            if (tabId === 'tabReports') {
                renderReport();
            } else {
                renderDashboard();
            }
        }

        function updateCategories(selectedCategory = "") {
            const type = document.getElementById("type").value;
            const categorySelect = document.getElementById("category");

            const allCategories = [
                ...categories[type],
                ...customCategories[type]
            ];

            categorySelect.innerHTML = "";

            allCategories.forEach(category => {
                const option = document.createElement("option");

                option.value = category;
                option.textContent = category;

                categorySelect.appendChild(option);
            });

            const createOption = document.createElement("option");

            createOption.value = "__new__";
            createOption.textContent = "Outros";

            categorySelect.appendChild(createOption);

            if (
                selectedCategory &&
                allCategories.includes(selectedCategory)
            ) {
                categorySelect.value = selectedCategory;
            }

            hideNewCategoryInput();
        }

        function handleCategoryChange() {
            const categorySelect = document.getElementById("category");
            const newCategoryGroup = document.getElementById("newCategoryGroup");
            const newCategoryInput = document.getElementById("newCategory");

            const isCreatingCategory = categorySelect.value === "__new__";

            newCategoryGroup.hidden = !isCreatingCategory;

            if (isCreatingCategory) {
                newCategoryInput.focus();
            } else {
                newCategoryInput.value = "";
            }
        }

        function hideNewCategoryInput() {
            const newCategoryGroup = document.getElementById("newCategoryGroup");
            const newCategoryInput = document.getElementById("newCategory");

            newCategoryGroup.hidden = true;
            newCategoryInput.value = "";
        }

        function addCustomCategory() {
            const type = document.getElementById("type").value;
            const newCategoryInput = document.getElementById("newCategory");

            const newCategory = newCategoryInput.value.trim();

            if (!newCategory) {
                alert("Digite o nome da categoria.");
                newCategoryInput.focus();
                return;
            }

            const allCategories = [
                ...categories[type],
                ...customCategories[type]
            ];

            const alreadyExists = allCategories.some(category =>
                category.toLocaleLowerCase("pt-BR") ===
                newCategory.toLocaleLowerCase("pt-BR")
            );

            if (alreadyExists) {
                alert("Essa categoria já existe.");
                return;
            }

            customCategories[type].push(newCategory);

            customCategories[type].sort((a, b) =>
                a.localeCompare(b, "pt-BR")
            );

            localStorage.setItem(
                CUSTOM_CATEGORIES_KEY,
                JSON.stringify(customCategories)
            );

            updateCategories(newCategory);
            initFilterCategories();
        }

        function initFilterCategories() {
            const filterCategorySelect =
                document.getElementById("filterCategory");

            const currentValue = filterCategorySelect.value;

            filterCategorySelect.innerHTML =
                '<option value="">Todas as Categorias</option>';

            const expenseCategories = [
                ...categories.expense,
                ...customCategories.expense
            ];

            expenseCategories.forEach(category => {
                const option = document.createElement("option");

                option.value = category;
                option.textContent = category;

                filterCategorySelect.appendChild(option);
            });

            if (expenseCategories.includes(currentValue)) {
                filterCategorySelect.value = currentValue;
            }
        }

        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();

            const selectedCategory = document.getElementById("category").value;

            if (selectedCategory === "__new__") {
                alert("Adicione a nova categoria antes de salvar o lançamento.");
                return;
            }

            const item = {
                id: Date.now(),
                type: document.getElementById('type').value,
                amount: parseFloat(document.getElementById('amount').value),
                category: selectedCategory,
                date: document.getElementById('date').value,
                description: document.getElementById('description').value
            };

            transactions.unshift(item);
            localStorage.setItem("app_transactions", JSON.stringify(transactions));
            
            e.target.reset();
            document.getElementById('date').valueAsDate = new Date();
            updateCategories();
            renderDashboard();
        });

        function deleteTransaction(id) {
            transactions = transactions.filter(t => t.id !== id);
            localStorage.setItem("app_transactions", JSON.stringify(transactions));
            renderDashboard();
            if (document.getElementById('tabReports').classList.contains('active')) {
                renderReport();
            }
        }

        function renderDashboard() {
            const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
            const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
            const balance = income - expense;

            document.getElementById('totalBalance').textContent = formatCurrency(balance);
            document.getElementById('totalIncome').textContent = `+${formatCurrency(income)}`;
            document.getElementById('totalExpense').textContent = `-${formatCurrency(expense)}`;

            const listEl = document.getElementById('transactionList');
            listEl.innerHTML = '';

            transactions.slice(0, 5).forEach(t => {
                const div = document.createElement('div');
                div.className = 'transaction-item';
                div.innerHTML = `
                    <div class="transaction-info">
                        <h4> ${t.category} </h4>
                        <small>${t.date} ${t.description ? '• ' + t.description : ''}</small>
                    </div>
                    <div class="transaction-amount ${t.type}">
                        ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
                        <button class="delete-btn" onclick="deleteTransaction(${t.id})">✕</button>
                    </div>
                `;
                listEl.appendChild(div);
            });
        }

        function getFilteredTransactions() {
            const start = document.getElementById('startDate').value;
            const end = document.getElementById('endDate').value;
            const catFilter = document.getElementById('filterCategory').value;

            return transactions.filter(t => {
                if (start && t.date < start) return false;
                if (end && t.date > end) return false;
                if (catFilter && t.category !== catFilter) return false;
                return true;
            });
        }

        function renderReport() {
            const filtered = getFilteredTransactions();
            const expenses = filtered.filter(t => t.type === 'expense');
            const totalExp = expenses.reduce((acc, t) => acc + t.amount, 0);

            // Resumo do período
            const startText = document.getElementById('startDate').value || 'Início';
            const endText = document.getElementById('endDate').value || 'Fim';
            const catText = document.getElementById('filterCategory').value || 'Todas';
            
            document.getElementById('reportSummary').textContent = 
                `Período: ${startText} até ${endText} | Categoria: ${catText} | Total Saídas: ${formatCurrency(totalExp)}`;

            // Agrupamento por Categoria
            const grouped = {};
            expenses.forEach(t => {
                grouped[t.category] = (grouped[t.category] || 0) + t.amount;
            });

            // Renderizar Lista Detalhada
            const detailedList = document.getElementById('detailedReportList');
            detailedList.innerHTML = '';

            if (Object.keys(grouped).length === 0) {
                detailedList.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem; padding: 8px 0;">Nenhum gasto encontrado para os filtros selecionados.</p>';
            }

            Object.keys(grouped).forEach(cat => {
                const categoryTotal = grouped[cat];
                const categoryPercentage = totalExp > 0
                    ? ((categoryTotal / totalExp) * 100).toFixed(1)
                    : 0;

                detailedList.innerHTML += `
                    <div class="report-category">
                        <div class="category-header">
                            <span>${cat} (${categoryPercentage}%)</span>
                            <span>${formatCurrency(categoryTotal)}</span>
                        </div>
                    </div>
                `;
            });

            // Renderizar Gráfico
            renderChart(grouped, totalExp);
        }

        function renderChart(grouped, totalExp) {
            const labels = Object.keys(grouped);
            const data = labels.map(label => grouped[label]);

            const ctx = document.getElementById('expenseChart').getContext('2d');
            
            if (chartInstance) chartInstance.destroy();

            chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f97316']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' },
                        datalabels: {
                            color: '#ffffff',
                            font: { weight: 'bold', size: 11 },
                            formatter: (value) => {
                                if (totalExp === 0) return '';
                                return ((value / totalExp) * 100).toFixed(1) + '%';
                            }
                        }
                    }
                }
            });
        }

        // EXPORTAÇÃO EXCEL / CSV
        function exportToCSV() {
            const filtered = getFilteredTransactions();
            if (filtered.length === 0) {
                alert("Nenhuma transação encontrada no período para exportar.");
                return;
            }

            let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
            csvContent += "Data;Tipo;Categoria;Observacao;Valor (RS)\n";

            filtered.forEach(t => {
                const row = [
                    t.date,
                    t.type === 'income' ? 'Entrada' : 'Saida',
                    `"${t.category}"`,
                    `"${t.description || ''}"`,
                    t.amount.toFixed(2).replace('.', ',')
                ].join(";");
                csvContent += row + "\n";
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `relatorio_financeiro_${document.getElementById('startDate').value}_a_${document.getElementById('endDate').value}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        function formatCurrency(val) {
            return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
