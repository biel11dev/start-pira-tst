import axios from "axios";
import { useEffect, useState } from "react";
import Message from "./Message";
import "./Ponto.css";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Ponto = () => {
  const [employees, setEmployees] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [selectedTab, setSelectedTab] = useState("daily");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null); // Novo estado para funcionário selecionado
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newCargo, setNewCargo] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [tempValues, setTempValues] = useState({});
  const [showFaltaModal, setShowFaltaModal] = useState(false);
  const [showFaltaManualModal, setShowFaltaManualModal] = useState(false);
  const [faltaEmployee, setFaltaEmployee] = useState(null);
  const [faltaEmployeeManual, setFaltaEmployeeManual] = useState(null);
  const [faltaPoint, setFaltaPoint] = useState(null);
  const [faltaPointManual, setFaltaPointManual] = useState(null);
  const [faltaHoras, setFaltaHoras] = useState(1);
  const [faltaHorasManual, setFaltaHorasManual] = useState(1);

  const fetchEmployees = async (date) => {
    setLoading(true);
    try {
      const employeesResponse = await axios.get("https://api-start-pira.vercel.app/api/employees");
      const employeesData = employeesResponse.data;

      // Se não há funcionário selecionado, seleciona o primeiro
      if (!selectedEmployeeId && employeesData.length > 0) {
        setSelectedEmployeeId(employeesData[0].id);
      }

      const dailyPointsResponse = await axios.get("https://api-start-pira.vercel.app/api/daily-points");
      const dailyPointsData = dailyPointsResponse.data;

      const filteredDate = date || new Date().toISOString().split("T")[0];

      const updatedEmployees = employeesData.map((employee) => {
        const dailyPoint = dailyPointsData.find(
          (point) => point.employeeId === employee.id && point.date.startsWith(filteredDate)
        );

        const entry = dailyPoint?.entry ? dailyPoint.entry.split("T")[1].slice(0, 5) : "";
        const exit = dailyPoint?.exit ? dailyPoint.exit.split("T")[1].slice(0, 5) : "";

        return {
          ...employee,
          entry,
          exit,
          gateOpen: dailyPoint?.gateOpen ? dailyPoint.gateOpen.split("T")[1].slice(0, 5) : "",
          workedHours: calculateWorkedHours(entry, exit),
          extraOrMissingHours: calculateExtraOrMissingHours(entry, exit, employee.carga),
          carga: employee.carga || 8,
          falta: dailyPoint?.falta || false,
        };
      });

      setEmployees(updatedEmployees);
    } catch (error) {
      console.error("Erro ao buscar funcionários ou pontos diários:", error);
      setMessage("Erro ao carregar dados.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Função para gerar PDF
  const generatePDF = async () => {
    if (!selectedEmployeeId) {
      setMessage({ show: true, text: "Selecione um funcionário primeiro!", type: "error" });
      return;
    }

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Função para adicionar marca d'água
const addWatermark = () => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 200;
      canvas.height = 200;
      ctx.globalAlpha = 0.1;
      ctx.drawImage(img, 0, 0, 200, 200);
      const watermarkData = canvas.toDataURL('image/png');
      pdf.addImage(watermarkData, 'PNG', pageWidth/2 - 50, pageHeight/2 - 50, 100, 100);
      resolve();
    };
    
    img.onerror = () => {
      console.warn('Marca d\'água não encontrada, continuando sem ela');
      resolve();
    };
    
    // Tenta carregar da pasta public
    img.src = '/Marca_Dagua.png';
  });
};

      await addWatermark();

      // Buscar dados do funcionário selecionado
      const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
      if (!selectedEmployee) {
        setMessage({ show: true, text: "Funcionário não encontrado!", type: "error" });
        return;
      }

      // Cabeçalho
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      
      let title = '';
      if (selectedTab === 'daily') {
        title = 'FOLHA DE PONTO DIÁRIA';
      } else if (selectedTab === 'weekly') {
        title = 'RELATÓRIO SEMANAL';
      } else if (selectedTab === 'monthly') {
        title = 'RELATÓRIO MENSAL';
      }
      
      pdf.text(title, pageWidth/2, 30, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      // Informações do funcionário
      pdf.text(`Funcionário: ${selectedEmployee.name}`, 20, 50);
      pdf.text(`Cargo: ${selectedEmployee.position || 'N/A'}`, 20, 60);
      pdf.text(`Carga Horária Exigida: ${selectedEmployee.carga || 8}h/dia`, 20, 70);
      
      let yPosition = 90;

      if (selectedTab === 'daily') {
        // Relatório Diário
        pdf.text(`Data: ${formatDateWithWeekday(selectedDate)}`, 20, 80);
        yPosition = 100;
        
        pdf.text(`Entrada: ${selectedEmployee.entry || '--:--'}`, 20, yPosition);
        yPosition += 10;
        pdf.text(`Saída: ${selectedEmployee.exit || '--:--'}`, 20, yPosition);
        yPosition += 20;
        
        pdf.text(`Horas Trabalhadas: ${selectedEmployee.workedHours || '0h 0m'}`, 20, yPosition);
        yPosition += 10;
        pdf.text(`Horas Extras/Faltantes: ${selectedEmployee.extraOrMissingHours || '0h 0m'}`, 20, yPosition);
        
      } else if (selectedTab === 'weekly') {
        // Relatório Semanal
        const weeklyEmployee = weeklyData.find(emp => emp.id === selectedEmployeeId);
        if (weeklyEmployee && weeklyEmployee.points) {
          const { startDate, endDate } = getWeekRange(new Date(selectedDate));
          pdf.text(`Período: ${startDate.toLocaleDateString("pt-BR")} - ${endDate.toLocaleDateString("pt-BR")}`, 20, 80);
          
          yPosition = 100;
          pdf.setFont('helvetica', 'bold');
          pdf.text('DETALHAMENTO DIÁRIO:', 20, yPosition);
          pdf.setFont('helvetica', 'normal');
          yPosition += 15;
          
          const pointsSorted = [...weeklyEmployee.points].sort((a, b) => new Date(a.date) - new Date(b.date));
          
          let totalWorkedMin = 0;
          let totalExtraMin = 0;
          
          // Substituir forEach por for...of para evitar problemas com async/await
          for (const point of pointsSorted) {
            const entry = point.entry ? point.entry.split("T")[1].slice(0, 5) : "--:--";
            const exit = point.exit ? point.exit.split("T")[1].slice(0, 5) : "--:--";
            
            const workedHours = calculateWorkedHours(entry, exit);
            const extraHours = calculateExtraOrMissingHours(entry, exit, selectedEmployee.carga);
            
            // Calcular totais
            const workedMatch = workedHours.match(/(\d+)h\s+(\d+)m/);
            if (workedMatch) {
              totalWorkedMin += parseInt(workedMatch[1]) * 60 + parseInt(workedMatch[2]);
            }
            
            const extraMatch = extraHours.match(/([+-]?)(\d+)h\s+(\d+)m/);
            if (extraMatch) {
              const sign = extraMatch[1] === '-' ? -1 : 1;
              totalExtraMin += sign * (parseInt(extraMatch[2]) * 60 + parseInt(extraMatch[3]));
            }
            
            pdf.text(`${formatDateWithWeekday(point.date)}:`, 20, yPosition);
            yPosition += 8;
            pdf.text(`  Entrada: ${entry} | Saída: ${exit} | Trabalhadas: ${workedHours}`, 25, yPosition);
            yPosition += 8;
            pdf.text(`  Extras/Faltantes: ${extraHours}`, 25, yPosition);
            yPosition += 12;
            
            if (yPosition > 250) {
              pdf.addPage();
              await addWatermark();
              yPosition = 30;
            }
          }
          
          // Resumo da semana
          yPosition += 10;
          pdf.setFont('helvetica', 'bold');
          pdf.text('RESUMO DA SEMANA:', 20, yPosition);
          pdf.setFont('helvetica', 'normal');
          yPosition += 10;
          
          const totalWorkedHours = Math.floor(totalWorkedMin / 60);
          const totalWorkedMinutes = totalWorkedMin % 60;
          pdf.text(`Total Trabalhado: ${totalWorkedHours}h ${totalWorkedMinutes}m`, 20, yPosition);
          yPosition += 8;
          
          const totalExtraHours = Math.floor(Math.abs(totalExtraMin) / 60);
          const totalExtraMinutes = Math.abs(totalExtraMin) % 60;
          const extraSign = totalExtraMin >= 0 ? '+' : '-';
          pdf.text(`Total Extras/Faltantes: ${extraSign}${totalExtraHours}h ${totalExtraMinutes}m`, 20, yPosition);
        }
        
      } else if (selectedTab === 'monthly') {
        // Relatório Mensal
        const monthlyEmployee = monthlyData.find(emp => emp.id === selectedEmployeeId);
        if (monthlyEmployee && monthlyEmployee.points) {
          const currentMonth = new Date(selectedDate);
          pdf.text(`Mês/Ano: ${currentMonth.toLocaleDateString("pt-BR", { month: 'long', year: 'numeric' })}`, 20, 80);
          
          yPosition = 100;
          pdf.setFont('helvetica', 'bold');
          pdf.text('RESUMO MENSAL:', 20, yPosition);
          pdf.setFont('helvetica', 'normal');
          yPosition += 15;
          
          const pointsSorted = [...monthlyEmployee.points].sort((a, b) => new Date(a.date) - new Date(b.date));
          
          let totalWorkedMin = 0;
          let totalExtraMin = 0;
          let totalDays = pointsSorted.length;
          
          // Substituir forEach por for...of
          for (const point of pointsSorted) {
            const entry = point.entry ? point.entry.split("T")[1].slice(0, 5) : "";
            const exit = point.exit ? point.exit.split("T")[1].slice(0, 5) : "";
            
            const workedHours = calculateWorkedHours(entry, exit);
            const extraHours = calculateExtraOrMissingHours(entry, exit, selectedEmployee.carga);
            
            // Calcular totais
            const workedMatch = workedHours.match(/(\d+)h\s+(\d+)m/);
            if (workedMatch) {
              totalWorkedMin += parseInt(workedMatch[1]) * 60 + parseInt(workedMatch[2]);
            }
            
            const extraMatch = extraHours.match(/([+-]?)(\d+)h\s+(\d+)m/);
            if (extraMatch) {
              const sign = extraMatch[1] === '-' ? -1 : 1;
              totalExtraMin += sign * (parseInt(extraMatch[2]) * 60 + parseInt(extraMatch[3]));
            }
          }
          
          // Estatísticas mensais
          pdf.text(`Total de Dias Trabalhados: ${totalDays}`, 20, yPosition);
          yPosition += 10;
          
          const totalWorkedHours = Math.floor(totalWorkedMin / 60);
          const totalWorkedMinutes = totalWorkedMin % 60;
          pdf.text(`Total de Horas Trabalhadas: ${totalWorkedHours}h ${totalWorkedMinutes}m`, 20, yPosition);
          yPosition += 10;
          
          const totalExtraHours = Math.floor(Math.abs(totalExtraMin) / 60);
          const totalExtraMinutes = Math.abs(totalExtraMin) % 60;
          const extraSign = totalExtraMin >= 0 ? '+' : '-';
          pdf.text(`Saldo Horas Extras/Faltantes: ${extraSign}${totalExtraHours}h ${totalExtraMinutes}m`, 20, yPosition);
          yPosition += 15;
          
          // Detalhamento por dia (resumido)
          pdf.setFont('helvetica', 'bold');
          pdf.text('DETALHAMENTO POR DIA:', 20, yPosition);
          pdf.setFont('helvetica', 'normal');
          yPosition += 10;
          
          // Substituir forEach por for...of
          for (const point of pointsSorted) {
            const entry = point.entry ? point.entry.split("T")[1].slice(0, 5) : "--:--";
            const exit = point.exit ? point.exit.split("T")[1].slice(0, 5) : "--:--";
            const workedHours = calculateWorkedHours(entry, exit);
            
            pdf.text(`${formatDateWithWeekday(point.date)}: ${entry}-${exit} (${workedHours})`, 20, yPosition);
            yPosition += 8;
            
            if (yPosition > 250) {
              pdf.addPage();
              await addWatermark();
              yPosition = 30;
            }
          }
        }
      }
      
      // Rodapé
      pdf.setFontSize(10);
      pdf.text('START PIRA - Sistema de Controle de Ponto', pageWidth/2, pageHeight - 20, { align: 'center' });
      pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth/2, pageHeight - 10, { align: 'center' });
      

    let filePrefix = '';
    if (selectedTab === 'daily') {
      filePrefix = 'diario';
    } else if (selectedTab === 'weekly') {
      filePrefix = 'semana';
    } else if (selectedTab === 'monthly') {
      filePrefix = 'mes';
    }
    
    // Salvar PDF com nome traduzido
    const fileName = `${filePrefix}-${selectedEmployee.name.replace(/\s+/g, '-')}-${selectedDate}.pdf`;
    pdf.save(fileName);

      setMessage({ show: true, text: "PDF gerado com sucesso!", type: "success" });
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      setMessage({ show: true, text: "Erro ao gerar PDF!", type: "error" });
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const getWeekRange = (date) => {
    const currentDate = new Date(date);
    const dayOfWeek = currentDate.getDay();
    const startOffset = dayOfWeek === 0 ? -6 : 2 - dayOfWeek;
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() + startOffset);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 5);

    return { startDate, endDate };
  };

  const fetchWeeklyData = async (dateRef) => {
    setLoading(true);
    const { startDate, endDate } = getWeekRange(dateRef || new Date());
    const pad = (n) => n.toString().padStart(2, "0");
    const startDateStr = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`;
    const endDateStr = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}`;

    try {
      const employeesResponse = await axios.get("https://api-start-pira.vercel.app/api/employees");
      const dailyPointsResponse = await axios.get(`https://api-start-pira.vercel.app/api/daily-points?startDate=${startDateStr}&endDate=${endDateStr}`);

      const dailyPointsData = dailyPointsResponse.data;

      const updatedWeeklyData = employeesResponse.data.map((employee) => {
        const points = dailyPointsData.filter((point) => {
          const pointDate = point.date.split("T")[0];
          return point.employeeId === employee.id && pointDate >= startDateStr && pointDate <= endDateStr;
        });
        return {
          ...employee,
          points,
        };
      });

      setWeeklyData(updatedWeeklyData);
    } catch (error) {
      console.error("Erro ao buscar dados semanais:", error);
      setMessage("Erro ao carregar dados semanais.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyData = async (dateRef) => {
    setLoading(true);
    const currentMonth = (dateRef || new Date()).toISOString().slice(0, 7);
    try {
      const employeesResponse = await axios.get("https://api-start-pira.vercel.app/api/employees");
      const dailyPointsResponse = await axios.get(`https://api-start-pira.vercel.app/api/daily-points?month=${currentMonth}`);

      const dailyPointsData = dailyPointsResponse.data;

      const updatedMonthlyData = employeesResponse.data.map((employee) => {
        const points = dailyPointsData.filter((point) => point.employeeId === employee.id && point.date.startsWith(currentMonth));

        const totalExtraOrMissingHours = points.reduce((total, point) => {
          const entry = point.entry ? point.entry.split("T")[1].slice(0, 5) : "";
          const exit = point.exit ? point.exit.split("T")[1].slice(0, 5) : "";
          const extraOrMissing = calculateExtraOrMissingHours(entry, exit, employee.carga || 8);
          const [hours, minutes] = extraOrMissing
            .replace(/[^\d\-+]/g, "")
            .split("h")
            .map(Number);
          return total + (hours * 60 + (minutes || 0)) * (extraOrMissing.startsWith("-") ? -1 : 1);
        }, 0);

        return {
          ...employee,
          points,
          totalExtraOrMissingHours,
        };
      });

      setMonthlyData(updatedMonthlyData);
    } catch (error) {
      console.error("Erro ao buscar dados mensais:", error);
      setMessage("Erro ao carregar dados mensais.");
    } finally {
      setLoading(false);
    }
  };

  const [editValues, setEditValues] = useState({
  name: "",
  position: "",
  carga: 8,
});

// Atualiza os campos quando o funcionário selecionado mudar
useEffect(() => {
  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
  setEditValues({
    name: selectedEmployee?.name || "",
    position: selectedEmployee?.position || "",
    carga: selectedEmployee?.carga || 8,
  });
}, [selectedEmployeeId, employees]);

const handleEditChange = (field, value) => {
  setEditValues(prev => ({ ...prev, [field]: value }));
};

const handleSaveEdit = () => {
  if (!selectedEmployeeId) return;
  handleUpdateEmployee(selectedEmployeeId, {
    name: editValues.name,
    position: editValues.position,
    carga: parseInt(editValues.carga) || 8,
  });
};

  useEffect(() => {
    if (selectedTab === "weekly") {
      fetchWeeklyData(new Date(selectedDate));
    } else if (selectedTab === "monthly") {
      fetchMonthlyData(new Date(selectedDate));
    } else {
      fetchEmployees(selectedDate);
    }
  }, [selectedTab, selectedDate]);

  const handleRegisterTime = async (id) => {
    try {
      const updatedData = tempValues[id];
      if (!updatedData) return;

      const currentDate = selectedDate;

      const dailyPointsResponse = await axios.get(`https://api-start-pira.vercel.app/api/daily-points/${id}?date=${currentDate}`);

      const dailyPoints = dailyPointsResponse.data;
      const dailyPoint = Array.isArray(dailyPoints) ? dailyPoints[0] : dailyPoints;

      const dataToUpdate = {
        ...updatedData,
        date: currentDate,
        employeeId: id,
      };

      if (dailyPoint && dailyPoint.id) {
        await axios.put(`https://api-start-pira.vercel.app/api/daily-points/${dailyPoint.id}`, dataToUpdate);
      } else {
        await axios.post(`https://api-start-pira.vercel.app/api/daily-points`, dataToUpdate);
      }

      setEmployees((prev) =>
        prev.map((employee) => {
          if (employee.id === id) {
            const updatedEntry = updatedData.entry || employee.entry;
            const updatedExit = updatedData.exit || employee.exit;
            const updatedGateOpen = updatedData.gateOpen || employee.gateOpen;

            return {
              ...employee,
              entry: updatedEntry,
              exit: updatedExit,
              gateOpen: updatedGateOpen,
              workedHours: calculateWorkedHours(updatedEntry, updatedExit),
              extraOrMissingHours: calculateExtraOrMissingHours(updatedEntry, updatedExit, employee.carga),
            };
          }
          return employee;
        })
      );

      setTempValues((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
      setMessage({ show: true, text: "Registro de ponto atualizado com sucesso!", type: "success" });
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Erro ao atualizar horários:", error);
      setMessage({ show: true, text: "Falha ao atualizar registro de ponto!", type: "error" });
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate.toISOString().split("T")[0]);
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate.toISOString().split("T")[0]);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate.toISOString().split("T")[0]);
  };

  const handleAddEmployee = async () => {
    if (newEmployeeName.trim() === "") return;
    try {
      const newEmployee = {
        name: newEmployeeName,
        position: newCargo,
        entry: "",
        exit: "",
        gateOpen: "",
        dailyHours: 8,
      };

      const response = await axios.post("https://api-start-pira.vercel.app/api/employees", newEmployee);

      setEmployees([...employees, response.data]);
      setNewEmployeeName("");
      setNewCargo("");
      
      // Se é o primeiro funcionário, seleciona automaticamente
      if (employees.length === 0) {
        setSelectedEmployeeId(response.data.id);
      }
      
      setMessage({ show: true, text: "Funcionário adicionado com sucesso", type: "success" });
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Erro ao adicionar funcionário:", error);
      setMessage("Erro ao adicionar funcionário.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleRemoveEmployee = async (id) => {
    setMessage({
      text: "Você tem certeza que deseja excluir este funcionário? Todos os registros de ponto também serão excluídos.",
      type: "confirm",
      onConfirm: async () => {
        try {
          await axios.delete(`https://api-start-pira.vercel.app/api/daily-points?employeeId=${id}`);
          await axios.delete(`https://api-start-pira.vercel.app/api/employees/${id}`);

          setEmployees((prevEmployees) => prevEmployees.filter((employee) => employee.id !== id));
          
          // Se o funcionário removido era o selecionado, seleciona outro
          if (selectedEmployeeId === id) {
            const remainingEmployees = employees.filter(emp => emp.id !== id);
            if (remainingEmployees.length > 0) {
              setSelectedEmployeeId(remainingEmployees[0].id);
            } else {
              setSelectedEmployeeId(null);
            }
          }
          
          setMessage({ text: "Funcionário removido com sucesso!", type: "success" });
          setTimeout(() => setMessage(""), 3000);
        } catch (error) {
          console.error("Erro ao remover funcionário:", error);
          setMessage({ text: "Erro ao remover funcionário.", type: "error" });
          setTimeout(() => setMessage(""), 3000);
        }
      },
      onClose: () => setMessage(null),
    });
  };

  const handleDeleteDailyPoint = async (employeeId, date) => {
    try {
      const currentDate = new Date(date);
      const response = await axios.get(`https://api-start-pira.vercel.app/api/daily-points/${employeeId}?employeeId=${employeeId}&date=${currentDate.toISOString().split("T")[0]}`);
      const dailyPoints = response.data;
      const dailyPoint = Array.isArray(dailyPoints) ? dailyPoints[0] : dailyPoints;

      if (dailyPoint && dailyPoint.id) {
        await axios.delete(`https://api-start-pira.vercel.app/api/daily-points/${dailyPoint.id}`);
        setMessage({ text: "Registro de ponto removido com sucesso!", type: "success" });
        if (selectedTab === "weekly") {
          fetchWeeklyData();
        } else if (selectedTab === "monthly") {
          fetchMonthlyData();
        } else {
          fetchEmployees(selectedDate);
        }
      } else {
        setMessage({ text: "Registro de ponto não encontrado.", type: "error" });
      }
    } catch (error) {
      console.error("Erro ao remover registro de ponto:", error);
      console.error("Dados enviados:", { employeeId, date });
      setMessage({ text: "Erro ao remover registro de ponto.", type: "error" });
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleUpdateEmployee = async (id, updatedData) => {
    try {
      await axios.put(`https://api-start-pira.vercel.app/api/employees/${id}`, updatedData);

      setEmployees((prev) => prev.map((employee) => (employee.id === id ? { ...employee, ...updatedData } : employee)));
      setMessage("Dados atualizados com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar funcionário:", error);
      console.error("Dados enviados:", updatedData);
      setMessage("Erro ao atualizar funcionário.");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const calculateWorkedHours = (entry, exit) => {
    if (!entry || !exit) return "0h 0m";

    const entryTime = new Date(`1970-01-01T${entry}:00`);
    let exitTime = new Date(`1970-01-01T${exit}:00`);

    if (exitTime < entryTime) {
      exitTime.setDate(exitTime.getDate() + 1);
    }

    const diffMs = exitTime - entryTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHours}h ${diffMinutes}m`;
  };

  const calculateExtraOrMissingHours = (entry, exit, carga) => {
    if (!entry || !exit) return "0h 0m";

    const entryTime = new Date(`1970-01-01T${entry}:00`);
    let exitTime = new Date(`1970-01-01T${exit}:00`);

    if (exitTime < entryTime) {
      exitTime.setDate(exitTime.getDate() + 1);
    }

    const diffMs = exitTime - entryTime;
    const workedHours = diffMs / (1000 * 60 * 60);
    const extraOrMissing = workedHours - carga;

    const absHours = Math.floor(Math.abs(extraOrMissing));
    const absMinutes = Math.floor((Math.abs(extraOrMissing) % 1) * 60);

    return extraOrMissing > 0 ? `+${absHours}h ${absMinutes}m` : `-${absHours}h ${absMinutes}m`;
  };

  const calculateGateOpenTime = (entry, gateOpen) => {
    if (!entry || !gateOpen || gateOpen === "--:--" || gateOpen === "00:00") return "";

    const entryTime = new Date(`1970-01-01T${entry}:00`);
    let gateOpenTime = new Date(`1970-01-01T${gateOpen}:00`);

    if (gateOpenTime < entryTime) {
      gateOpenTime.setDate(gateOpenTime.getDate() + 1);
    }

    const diffMs = gateOpenTime - entryTime;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    return `${diffMinutes}m`;
  };

  function formatDateWithWeekday(dateString) {
    const dias = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
    const d = parseISODate(dateString);
    const dia = d.getDate().toString().padStart(2, "0");
    const mes = (d.getMonth() + 1).toString().padStart(2, "0");
    const ano = d.getFullYear().toString().slice(-2);
    const semana = dias[d.getDay()];
    return `${dia}/${mes}/${ano} - ${semana}`;
  }

  const parseISODate = (isoString) => {
    const [year, month, day] = isoString.split("T")[0].split("-");
    return new Date(Number(year), Number(month) - 1, Number(day));
  };

  const parseHourStringToMinutes = (str) => {
    if (!str) return 0;
    const match = str.match(/([+-]?)(\d+)h\s*(\d+)m/);
    if (!match) return 0;
    const sign = match[1] === "-" ? -1 : 1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3], 10);
    return sign * (hours * 60 + minutes);
  };

  const handleOpenFaltaModal = (employee, point) => {
    setFaltaEmployee(employee);
    setFaltaPoint(point);
    setFaltaHoras(1);
    setShowFaltaModal(true);
  };

  const handleOpenFaltaManualModal = (employee, point) => {
    setFaltaEmployeeManual(employee);
    setFaltaPointManual(point);
    setFaltaHorasManual(1);
    setShowFaltaManualModal(true);
  };

  const handleCloseFaltaModal = () => {
    setShowFaltaModal(false);
    setFaltaEmployee(null);
    setFaltaPoint(null);
    setFaltaHoras(1);
  };

  const handleCloseFaltaManualModal = () => {
    setShowFaltaManualModal(false);
    setFaltaEmployeeManual(null);
    setFaltaPointManual(null);
    setFaltaHorasManual(1);
  };

  const getDailyPointForEmployee = (employeeId, date) => {
    const dateWithTime = `${date} 00:00:00`;
    return axios.get(`https://api-start-pira.vercel.app/api/daily-points/${employeeId}?date=${encodeURIComponent(dateWithTime)}`).then((res) => {
      const dailyPoints = res.data;
      return Array.isArray(dailyPoints) ? dailyPoints[0] : dailyPoints;
    });
  };

  const handleConfirmFalta = async (tipo) => {
    if (!faltaEmployee || !faltaPoint) return;
    try {
      let entry = faltaPoint.entry ? faltaPoint.entry.split("T")[1].slice(0, 5) : "08:00";
      let exit = faltaPoint.exit ? faltaPoint.exit.split("T")[1].slice(0, 5) : "17:00";
      let carga = faltaEmployee.carga || 8;

      if (tipo === "removerHoras") {
        const entryDate = new Date(`1970-01-01T${entry}:00`);
        let exitDate = new Date(`1970-01-01T${exit}:00`);
        exitDate.setHours(exitDate.getHours() - faltaHoras);
        exit = exitDate.toTimeString().slice(0, 5);
      }

      const dataToUpdate = {
        entry,
        exit,
        date: faltaPoint.date,
        employeeId: faltaEmployee.id,
      };

      if (faltaPoint && faltaPoint.id && tipo === "falta") {
        await axios.put(`https://api-start-pira.vercel.app/api/daily-points/falta/${faltaEmployee.id}`, dataToUpdate);
      } else {
        await axios.put(`https://api-start-pira.vercel.app/api/daily-points/${faltaEmployee.id}`, dataToUpdate);
      }

      setShowFaltaModal(false);
      setFaltaEmployee(null);
      setFaltaPoint(null);
      setFaltaHoras(1);
      setMessage({ show: true, text: "Falta/ajuste registrado com sucesso!", type: "success" });
      fetchWeeklyData(selectedDate);
    } catch (error) {
      setMessage({ show: true, text: "Erro ao registrar falta/ajuste!", type: "error" });
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleConfirmFaltaManual = async (tipo) => {
    if (!faltaEmployeeManual || !faltaPointManual) return;
    try {
      let entry = faltaPointManual.entry ? faltaPointManual.entry.split("T")[1].slice(0, 5) : "08:00";
      let exit = faltaPointManual.exit ? faltaPointManual.exit.split("T")[1].slice(0, 5) : "17:00";
      let carga = faltaEmployeeManual.carga || 8;

      if (tipo === "removerHoras") {
        const entryDate = new Date(`1970-01-01T${entry}:00`);
        let exitDate = new Date(`1970-01-01T${exit}:00`);
        exitDate.setHours(exitDate.getHours() - faltaHoras);
        exit = exitDate.toTimeString().slice(0, 5);
      }

      const dataToUpdate = {
        entry,
        exit,
        date: faltaPointManual.date,
        employeeId: faltaEmployeeManual.id,
      };

      if (faltaPointManual && tipo === "falta") {
        await axios.put(`https://api-start-pira.vercel.app/api/daily-points/falta-manual/${faltaEmployeeManual.id}`, dataToUpdate);
      } else {
        await axios.put(`https://api-start-pira.vercel.app/api/daily-points/${faltaEmployeeManual.id}`, dataToUpdate);
      }

      setShowFaltaManualModal(false);
      setFaltaEmployeeManual(null);
      setFaltaPointManual(null);
      setFaltaHorasManual(1);
      setMessage({ show: true, text: "Falta/ajuste registrado com sucesso!", type: "success" });
      fetchEmployees(selectedDate);
    } catch (error) {
      setMessage({ show: true, text: "Erro ao registrar falta/ajuste!", type: "error" });
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // Filtrar dados baseado no funcionário selecionado
  const getFilteredData = () => {
    if (!selectedEmployeeId) return [];
    
    if (selectedTab === "daily") {
      return employees.filter(emp => emp.id === selectedEmployeeId);
    } else if (selectedTab === "weekly") {
      return weeklyData.filter(emp => emp.id === selectedEmployeeId);
    } else if (selectedTab === "monthly") {
      return monthlyData.filter(emp => emp.id === selectedEmployeeId);
    }
    return [];
  };

  const filteredData = getFilteredData();

  return (
    <div className="ponto-container">
      <h2 className="nome-ponto">Gerenciamento de Ponto</h2>
      {loading && <div className="loading">Carregando...</div>}
      {message && <Message message={message.text} type={message.type} onClose={message.onClose} onConfirm={message.onConfirm} />}

      {/* Seletor de funcionário */}
      <div className="employee-selector" style={{ margin: "20px 0", padding: "15px", background: "#f5f5f5", borderRadius: "8px" }}>
        <label style={{ marginRight: "10px", fontWeight: "bold", textShadow: "none" }}>Selecionar Funcionário:</label>
        <select 
          value={selectedEmployeeId || ""} 
          onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
          style={{ padding: "8px", marginRight: "15px", borderRadius: "4px", border: "1px solid #ccc", textShadow: "none" }}
        >
          <option value="">Selecione um funcionário</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.name} - {emp.position || 'N/A'}</option>
          ))}
        </select>
        
        {/* Botão para gerar PDF */}
        <button 
          onClick={generatePDF}
          style={{ 
            padding: "8px 15px", 
            background: "#d32f2f", 
            color: "white", 
            border: "none", 
            borderRadius: "4px", 
            cursor: "pointer",
            marginLeft: "10px"
          }}
          disabled={!selectedEmployeeId}
        >
          📄 Gerar PDF
        </button>
      </div>

      <div className="date-selector">
        <button onClick={handlePreviousMonth}>&lt;&lt; Mês</button>
        <button onClick={handlePreviousDay}>&lt; Dia</button>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        <button onClick={handleNextDay}>&gt; Dia</button>
        <button onClick={handleNextMonth}>&gt;&gt; Mês</button>
      </div>

      <div className="tabs">
        <button onClick={() => setSelectedTab("daily")} className={selectedTab === "daily" ? "active" : ""}>
          Visualização Diária
        </button>
        <button onClick={() => setSelectedTab("weekly")} className={selectedTab === "weekly" ? "active" : ""}>
          Visualização Semanal
        </button>
        <button onClick={() => setSelectedTab("monthly")} className={selectedTab === "monthly" ? "active" : ""}>
          Visualização Mensal
        </button>
      </div>
      
    {selectedTab === "weekly" && (
  <div className="week-tabs" style={{ margin: "16px 0", display: "flex", gap: 8 }}>
    {(() => {
      const date = parseISODate(selectedDate);
      const year = date.getFullYear();
      const month = date.getMonth();
      const lastDay = new Date(year, month + 1, 0);
      const weeks = [];
      let current = new Date(year, month, 1);

      while (current.getDay() !== 2) {
        current.setDate(current.getDate() + 1);
        if (current > lastDay) break;
      }

      while (current <= lastDay) {
        const start = new Date(current);
        const end = new Date(start);
        end.setDate(start.getDate() + 5);
        if (end > lastDay) end.setTime(lastDay.getTime());
        weeks.push({ start: new Date(start), end: new Date(end) });
        current.setDate(current.getDate() + 7);
      }

      return weeks.map((week, idx) => {
        const label = `${week.start.toLocaleDateString("pt-BR")} - ${week.end.toLocaleDateString("pt-BR")}`;
        const selected = parseISODate(selectedDate);
        selected.setHours(0, 0, 0, 0);
        const isActive = selected >= week.start && selected <= week.end;
        return (
          <button
            key={idx}
            style={{
              padding: "6px 12px",
              borderRadius: 4,
              border: "none",
              background: isActive 
                ? "linear-gradient(135deg, #0d29a5 0%, #330363 100%)" 
                : "#007bff",
              color: "#fff",
              fontWeight: isActive ? "bold" : "normal",
              cursor: "pointer",
              opacity: 1,
              outline: isActive ? "2px solid #fff" : "none",
              transition: "all 0.3s ease",
            }}
            onClick={() => setSelectedDate(week.start.toISOString().split("T")[0])}

          >
            {label}
          </button>
        );
      });
    })()}
  </div>
)}

      <div className="add-employee">
        <input type="text" value={newEmployeeName} onChange={(e) => setNewEmployeeName(e.target.value)} placeholder="Nome do Empregado" />
        <input type="text" value={newCargo} onChange={(e) => setNewCargo(e.target.value)} placeholder="Cargo" />
        <button onClick={handleAddEmployee}>Adicionar Empregado</button>
      </div>

{selectedEmployeeId && (() => {
  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
  if (!selectedEmployee) return null;
  return (
    <div
      style={{
        margin: "30px auto 20px auto",
        maxWidth: 500,
        background: "#f8f8f8",
        borderRadius: 10,
        boxShadow: "0 2px 8px #0001",
        padding: 24,
        textAlign: "center"
      }}
    >
      <h3 style={{ marginBottom: 16, textShadow: "none" }}>Gerenciamento do Empregado</h3>
      <div style={{ marginBottom: 12  }}>
        <label style={{ fontWeight: "bold", textShadow: "none" }}>Nome:</label>
        <input
          style={{ marginLeft: 8, padding: 6, borderRadius: 4, border: "1px solid #ccc", width: 200, textShadow: "none" }}
          type="text"
          value={editValues.name}
          onChange={e => handleEditChange("name", e.target.value)}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontWeight: "bold", textShadow: "none" }}>Cargo:</label>
        <input
          style={{ marginLeft: 8, padding: 6, borderRadius: 4, border: "1px solid #ccc", width: 200, textShadow: "none" }}
          type="text"
          value={editValues.position}
          onChange={e => handleEditChange("position", e.target.value)}
        />
      </div>
      <div style={{ marginBottom: 12, textShadow: "none" }}>
        <label style={{ fontWeight: "bold", textShadow: "none" }}>Valor h/:</label>
        <input
          style={{ marginLeft: 8, padding: 6, borderRadius: 4, border: "1px solid #ccc", width: 80, textShadow: "none" }}
          type="number"
          min={1}
          max={24}
          value={editValues.carga}
          onChange={e => handleEditChange("carga", e.target.value)}
        /> 
      </div>
      <div>
        <button
          style={{
            background: "#d32f2f",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "8px 18px",
            marginRight: 12,
            cursor: "pointer"
          }}
          onClick={() => handleRemoveEmployee(selectedEmployee.id)}
        >
          Excluir Empregado
        </button>
        <button
          style={{
            background: "#4caf50",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "8px 18px",
            marginRight: 12,
            cursor: "pointer"
          }}
          onClick={handleSaveEdit}
        >
          Salvar alterações
        </button>
      </div>
    </div>
  );
})()}

      <table className="ponto-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Empregado</th>
            <th>Cargo</th>
            <th>Entrada</th>
            <th>Saída</th>
            {/* <th>Portão Aberto</th> */}
            <th>Valor Hora</th>
            <th>Horas Trabalhadas</th>
            <th>Horas Extras/Faltantes</th>
            {/* <th>Tempo para Abrir Portão</th> */}
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {selectedTab === "daily" &&
            filteredData.map((employee) => (
              <tr key={employee.id} className={employee.falta ? "linha-falta" : ""}>
                <td className="td-funcionario">{formatDateWithWeekday(selectedDate)}</td>
                <td className="td-funcionario">{employee.name}</td>
                <td className="td-funcionario">{employee.position || "N/A"}</td>
                <td>
                  <input
                    className="input-funcionario"
                    type="time"
                    value={tempValues[employee.id]?.entry || employee.entry}
                    onChange={(e) =>
                      setTempValues((prev) => ({
                        ...prev,
                        [employee.id]: { ...prev[employee.id], entry: e.target.value },
                      }))
                    }
                  />
                </td>
                <td>
                  <input
                    className="input-funcionario"
                    type="time"
                    value={tempValues[employee.id]?.exit || employee.exit}
                    onChange={(e) =>
                      setTempValues((prev) => ({
                        ...prev,
                        [employee.id]: { ...prev[employee.id], exit: e.target.value },
                      }))
                    }
                  />
                </td>
                {/* <td>
                  <input
                    className="input-funcionario"
                    type="time"
                    value={tempValues[employee.id]?.gateOpen || employee.gateOpen}
                    onChange={(e) =>
                      setTempValues((prev) => ({
                        ...prev,
                        [employee.id]: { ...prev[employee.id], gateOpen: e.target.value },
                      }))
                    }
                  />
                </td> */}
                <td>
                  <input
                    className="input-funcionario"
                    type="number"
                    value={employee.carga}
                    onChange={(e) =>
                      handleUpdateEmployee(employee.id, {
                        carga: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    max="24"
                  />
                </td>
                <td className="td-funcionario">{calculateWorkedHours(employee.entry, employee.exit)}</td>
                <td className="td-funcionario">{calculateExtraOrMissingHours(employee.entry, employee.exit, employee.carga)}</td>
                {/* <td className="td-funcionario">{calculateGateOpenTime(employee.entry, employee.gateOpen)}</td> */}
                <td>
                  <button className="td-funcionario-atz" onClick={() => handleRegisterTime(employee.id)}>
                    Atualizar
                  </button>
                  <button className="td-funcionario" onClick={() => handleDeleteDailyPoint(employee.id, selectedDate)}>
                    Excluir
                  </button>
                  <button
                    className="td-funcionario"
                    style={{ background: "#d40000", color: "#fff", marginLeft: 4, marginTop: 9 }}
                    onClick={async () => {
                      const point = await getDailyPointForEmployee(employee.id, selectedDate);
                      handleOpenFaltaManualModal(employee, point || { date: selectedDate, entry: employee.entry, exit: employee.exit });
                    }}
                  >
                    Falta
                  </button>
                </td>
              </tr>
            ))}
          {selectedTab === "weekly" &&
            filteredData.flatMap((employee) => {
              const pointsSorted = [...employee.points].sort((a, b) => new Date(b.date) - new Date(a.date));

              const totalCarga = pointsSorted.reduce((acc) => acc + (employee.carga || 8), 0);
              const totalWorked = pointsSorted.reduce((acc, point) => {
                const entry = point.entry ? point.entry.split("T")[1].slice(0, 5) : "";
                const exit = point.exit ? point.exit.split("T")[1].slice(0, 5) : "";
                const match = calculateWorkedHours(entry, exit).match(/(\d+)h\s+(\d+)m/);
                const h = match ? parseInt(match[1], 10) : 0;
                const m = match ? parseInt(match[2], 10) : 0;
                return acc + (h * 60 + m);
              }, 0);
              const totalExtras = pointsSorted.reduce((acc, point) => {
                const entry = point.entry ? point.entry.split("T")[1].slice(0, 5) : "";
                const exit = point.exit ? point.exit.split("T")[1].slice(0, 5) : "";
                const str = calculateExtraOrMissingHours(entry, exit, employee.carga);
                return acc + parseHourStringToMinutes(str);
              }, 0);
              const totalGate = pointsSorted.reduce((acc, point) => {
                const entry = point.entry ? point.entry.split("T")[1].slice(0, 5) : "";
                const gate = point.gateOpen ? point.gateOpen.split("T")[1].slice(0, 5) : "";
                const min = Number(calculateGateOpenTime(entry, gate).replace("m", "")) || 0;
                return acc + min;
              }, 0);

              const formatHM = (min) => `${Math.floor(Math.abs(min) / 60)}h ${Math.abs(min) % 60}m`;
              const formatExtra = (min) => (min === 0 ? "0h 0m" : (min > 0 ? "+" : "-") + formatHM(min));

              return [
                ...pointsSorted.map((point) => (
                  <tr key={employee.id + point.date} className={point.falta ? "linha-falta" : ""}>
                    <td className="td-funcionario">{formatDateWithWeekday(point.date)}</td>
                    <td className="td-funcionario">{employee.name}</td>
                    <td className="td-funcionario">{employee.position || "N/A"}</td>
                    <td>
                      <input
                        className="input-funcionario"
                        type="time"
                        value={tempValues[employee.id]?.entry || (point.entry ? point.entry.split("T")[1].slice(0, 5) : "")}
                        onChange={(e) =>
                          setTempValues((prev) => ({
                            ...prev,
                            [employee.id]: { ...prev[employee.id], entry: e.target.value },
                          }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="input-funcionario"
                        type="time"
                        value={tempValues[employee.id]?.exit || (point.exit ? point.exit.split("T")[1].slice(0, 5) : "")}
                        onChange={(e) =>
                          setTempValues((prev) => ({
                            ...prev,
                            [employee.id]: { ...prev[employee.id], exit: e.target.value },
                          }))
                        }
                      />
                    </td>
                    {/* <td>
                      <input
                        className="input-funcionario"
                        type="time"
                        value={tempValues[employee.id]?.gateOpen || (point.gateOpen ? point.gateOpen.split("T")[1].slice(0, 5) : "")}
                        onChange={(e) =>
                          setTempValues((prev) => ({
                            ...prev,
                            [employee.id]: { ...prev[employee.id], gateOpen: e.target.value },
                          }))
                        }
                      />
                    </td> */}
                    <td>
                      <input
                        className="input-funcionario"
                        type="number"
                        value={employee.carga}
                        onChange={(e) =>
                          handleUpdateEmployee(employee.id, {
                            carga: parseInt(e.target.value),
                          })
                        }
                        min="1"
                        max="24"
                      />
                    </td>
                    <td className="td-funcionario">
                      {calculateWorkedHours(point.entry ? point.entry.split("T")[1].slice(0, 5) : "", point.exit ? point.exit.split("T")[1].slice(0, 5) : "")}
                    </td>
                    <td className="td-funcionario">
                      {calculateExtraOrMissingHours(
                        point.entry ? point.entry.split("T")[1].slice(0, 5) : "",
                        point.exit ? point.exit.split("T")[1].slice(0, 5) : "",
                        employee.carga
                      )}
                    </td>
                    {/* <td className="td-funcionario">
                      {calculateGateOpenTime(point.entry ? point.entry.split("T")[1].slice(0, 5) : "", point.gateOpen ? point.gateOpen.split("T")[1].slice(0, 5) : "")}
                    </td> */}
                    <td>
                      <button className="td-funcionario" style={{ background: "#d40000", color: "#fff", marginLeft: 4 }} onClick={() => handleOpenFaltaModal(employee, point)}>
                        Falta
                      </button>
                    </td>
                  </tr>
                )),
                <tr key={employee.id + "-resumo"}>
                  <td colSpan={5} style={{ textAlign: "center", fontWeight: "bold", background: "black", color: "#fff" }}>
                    Resumo horas:
                  </td>
                  <td style={{ fontWeight: "bold", background: "black", color: "#fff" }}>{totalCarga}</td>
                  <td style={{ fontWeight: "bold", background: "black", color: "#fff" }}>{formatHM(totalWorked)}</td>
                  <td style={{ fontWeight: "bold", background: "black", color: "#fff" }}>{formatExtra(totalExtras)}</td>
                  {/* <td style={{ fontWeight: "bold", background: "black", color: "#fff" }}>{totalGate}m</td> */}
                  <td style={{ background: "black" }}></td>
                </tr>,
              ];
            })}
          {selectedTab === "monthly" &&
            filteredData.flatMap((employee) => {
              const pointsSorted = (employee.points || []).sort((a, b) => new Date(b.date) - new Date(a.date));

              const totalCargaMin = pointsSorted.reduce((acc) => acc + (employee.carga || 8) * 60, 0);
              const totalWorkedMin = pointsSorted.reduce((acc, point) => {
                const entry = point.entry ? point.entry.split("T")[1].slice(0, 5) : "";
                const exit = point.exit ? point.exit.split("T")[1].slice(0, 5) : "";
                const match = calculateWorkedHours(entry, exit).match(/(\d+)h\s+(\d+)m/);
                const h = match ? parseInt(match[1], 10) : 0;
                const m = match ? parseInt(match[2], 10) : 0;
                return acc + (h * 60 + m);
              }, 0);
              const totalExtras = totalWorkedMin - totalCargaMin;
              const totalCarga = totalCargaMin / 60;
              const totalWorked = totalWorkedMin;
              const totalGate = pointsSorted.reduce((acc, point) => {
                const entry = point.entry ? point.entry.split("T")[1].slice(0, 5) : "";
                const gate = point.gateOpen ? point.gateOpen.split("T")[1].slice(0, 5) : "";
                const min = Number(calculateGateOpenTime(entry, gate).replace("m", "")) || 0;
                return acc + min;
              }, 0);

              const formatHM = (min) => `${Math.floor(Math.abs(min) / 60)}h ${Math.abs(min) % 60}m`;
              const formatExtra = (min) => (min === 0 ? "0h 0m" : (min > 0 ? "+" : "-") + formatHM(min));
              return [
                ...pointsSorted.map((point) => (
                  <tr key={employee.id + point.date} className={point.falta ? "linha-falta" : ""}>
                    <td className="td-funcionario">{formatDateWithWeekday(point.date)}</td>
                    <td className="td-funcionario">{employee.name}</td>
                    <td className="td-funcionario">{employee.position || "N/A"}</td>
                    <td>
                      <input
                        className="input-funcionario"
                        type="time"
                        value={tempValues[employee.id]?.entry || (point.entry ? point.entry.split("T")[1].slice(0, 5) : "")}
                        onChange={(e) =>
                          setTempValues((prev) => ({
                            ...prev,
                            [employee.id]: { ...prev[employee.id], entry: e.target.value },
                          }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="input-funcionario"
                        type="time"
                        value={tempValues[employee.id]?.exit || (point.exit ? point.exit.split("T")[1].slice(0, 5) : "")}
                        onChange={(e) =>
                          setTempValues((prev) => ({
                            ...prev,
                            [employee.id]: { ...prev[employee.id], exit: e.target.value },
                          }))
                        }
                      />
                    </td>
                    {/* <td>
                      <input
                        className="input-funcionario"
                        type="time"
                        value={tempValues[employee.id]?.gateOpen || (point.gateOpen ? point.gateOpen.split("T")[1].slice(0, 5) : "")}
                        onChange={(e) =>
                          setTempValues((prev) => ({
                            ...prev,
                            [employee.id]: { ...prev[employee.id], gateOpen: e.target.value },
                          }))
                        }
                      />
                    </td> */}
                    <td>
                      <input
                        className="input-funcionario"
                        type="number"
                        value={employee.carga}
                        onChange={(e) =>
                          handleUpdateEmployee(employee.id, {
                            carga: parseInt(e.target.value),
                          })
                        }
                        min="1"
                        max="24"
                      />
                    </td>
                    <td className="td-funcionario">
                      {calculateWorkedHours(point.entry ? point.entry.split("T")[1].slice(0, 5) : "", point.exit ? point.exit.split("T")[1].slice(0, 5) : "")}
                    </td>
                    <td className="td-funcionario">
                      {calculateExtraOrMissingHours(
                        point.entry ? point.entry.split("T")[1].slice(0, 5) : "",
                        point.exit ? point.exit.split("T")[1].slice(0, 5) : "",
                        employee.carga
                      )}
                    </td>
                    {/* <td className="td-funcionario">
                      {calculateGateOpenTime(point.entry ? point.entry.split("T")[1].slice(0, 5) : "", point.gateOpen ? point.gateOpen.split("T")[1].slice(0, 5) : "")}
                    </td> */}
                    <td>
                      <button className="td-funcionario" onClick={() => handleOpenFaltaModal(employee, point)}>
                        Falta
                      </button>
                    </td>
                  </tr>
                )),
                <tr key={employee.id + "-resumo"}>
                  <td colSpan={5} style={{ textAlign: "center", fontWeight: "bold", background: "black", color: "#fff" }}>
                    Resumo horas:
                  </td>
                  <td style={{ fontWeight: "bold", background: "black", color: "#fff" }}>{totalCarga}</td>
                  <td style={{ fontWeight: "bold", background: "black", color: "#fff" }}>{formatHM(totalWorked)}</td>
                  <td style={{ fontWeight: "bold", background: "black", color: "#fff" }}>{formatExtra(totalExtras)}</td>
                  {/* <td style={{ fontWeight: "bold", background: "black", color: "#fff" }}>{totalGate}m</td> */}
                  <td style={{ background: "black" }}></td>
                </tr>,
              ];
            })}
        </tbody>
      </table>
      
      {/* Modais de falta (mantidos inalterados) */}
      {showFaltaModal && (
        <div
          className="modal-falta"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "white",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div style={{ background: "#fff", padding: 24, borderRadius: 8, minWidth: 320 }}>
            <h3 style={{ marginBottom: 16 }}>Registrar Falta/Atraso</h3>
            <button
              style={{ background: "#d40000", color: "#fff", padding: "8px 16px", border: "none", borderRadius: 4, marginBottom: 12, width: "100%" }}
              onClick={() => handleConfirmFalta("falta")}
            >
              Marcar Falta (remover 8h)
            </button>
            <div style={{ margin: "16px 0" }}>
              <label className="label-falta" style={{ marginRight: 8 }}>
                Remover horas do ponto:
              </label>
              <input type="number" min={1} max={8} value={faltaHoras} onChange={(e) => setFaltaHoras(Number(e.target.value))} style={{ width: 60, marginRight: 8 }} />
              <button style={{ background: "#1976d2", color: "#fff", padding: "6px 12px", border: "none", borderRadius: 4 }} onClick={() => handleConfirmFalta("removerHoras")}>
                Remover Horas
              </button>
            </div>
            <button style={{ marginTop: 8, background: "#888", color: "#fff", border: "none", borderRadius: 4, padding: "6px 12px" }} onClick={handleCloseFaltaModal}>
              Cancelar
            </button>
          </div>
        </div>
      )}
      {showFaltaManualModal && (
        <div
          className="modal-falta"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "white",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div style={{ background: "#fff", padding: 24, borderRadius: 8, minWidth: 320 }}>
            <h3 style={{ marginBottom: 16 }}>Registrar Falta/Atraso</h3>
            <button
              style={{ background: "#d40000", color: "#fff", padding: "8px 16px", border: "none", borderRadius: 4, marginBottom: 12, width: "100%" }}
              onClick={() => handleConfirmFaltaManual("falta")}
            >
              Marcar Falta (remover 8h)
            </button>
            <div style={{ margin: "16px 0" }}>
              <label className="label-falta" style={{ marginRight: 8 }}>
                Remover horas do ponto:
              </label>
              <input type="number" min={1} max={8} value={faltaHorasManual} onChange={(e) => setFaltaHorasManual(Number(e.target.value))} style={{ width: 60, marginRight: 8 }} />
              <button
                style={{ background: "#1976d2", color: "#fff", padding: "6px 12px", border: "none", borderRadius: 4 }}
                onClick={() => handleConfirmFaltaManual("removerHoras")}
              >
                Remover Horas
              </button>
            </div>
            <button style={{ marginTop: 8, background: "#888", color: "#fff", border: "none", borderRadius: 4, padding: "6px 12px" }} onClick={handleCloseFaltaManualModal}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ponto;