'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import GeneralInformationStep from '../../components/create-pic/GeneralInformationStep';
import ProcedureStepsStep from '../../components/create-pic/ProcedureStepsStep';
import DocumentUpdateStep from '../../components/create-pic/DocumentUpdateStep';
import ValidationStep from '../../components/create-pic/ValidationStep';
import RequiredApprovalsStep from '../../components/create-pic/RequiredApprovalsStep';
import AvailabilityChangeReasonStep from '../../components/create-pic/AvailabilityChangeReasonStep';
import AttachFileStep from '../../components/create-pic/AttachFileStep';
import SuccessStep from '../../components/create-pic/SuccessStep';
import PageBanner from '@/app/components/PageBanner';
import { useCreatePic, useUpdatePic, useGetPic, useGetEmpleados, useGetConfiguration } from '@/hooks/usePics';
import { picSchemaRefined } from '@/lib/validations/picSchema';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';

export default function CreatePicPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const picId = searchParams.get('id');
  const isEditMode = !!picId;
  
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdPicId, setCreatedPicId] = useState(null);
  const [archivoAdjunto, setArchivoAdjunto] = useState(null);
  const [isLoadingPic, setIsLoadingPic] = useState(isEditMode);
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user from localStorage
  useEffect(() => {
    const getUserData = () => {
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          if (user && user.emp_id) {
            setCurrentUser(user);
          }
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    };

    getUserData();
    // Listen for storage changes (in case user logs in from another tab)
    window.addEventListener('storage', getUserData);
    return () => window.removeEventListener('storage', getUserData);
  }, []);

  // Fetch PIC data if in edit mode
  const { data: picData, isLoading: isLoadingPicData } = useGetPic(picId);
  
  // TanStack Query mutations
  const createPicMutation = useCreatePic();
  const updatePicMutation = useUpdatePic();
  
  // Use the appropriate mutation based on mode
  const currentMutation = isEditMode ? updatePicMutation : createPicMutation;

  // Helper function to format date to YYYY-MM-DD
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  // Get employees from database to use as available approvers  
  const { data: empleados = [] } = useGetEmpleados();
  
  // Get configuration (areas with mandatory approvers)
  const { data: areas = [] } = useGetConfiguration();
  
  // Transform PIC data from database format to form format
  const transformPicToForm = useCallback((pic) => {
    if (!pic) return null;
    
    // Get the affected area - convert to string to match dropdown format
    let areaAfectadaValue = '';
    if (pic.affectedArea !== undefined && pic.affectedArea !== null) {
      // If affectedArea exists, use it (convert to string to match dropdown format)
      areaAfectadaValue = String(pic.affectedArea);
    } else if (pic.affected_area !== undefined && pic.affected_area !== null) {
      // Try snake_case version (in case it's stored that way in raw queries)
      areaAfectadaValue = String(pic.affected_area);
    }
    
    return {
      areaAfectada: areaAfectadaValue,
      plataforma: pic.platform || '',
      numerosParteAfectados: pic.affectedPartNumbers || 'todos',
      numerosParteTexto: pic.partNumbersText || '',
      temporalDefinitivo: pic.temporaryPermanent || 'Temporal',
      tipoTemporal: pic.temporaryType || 'Piezas',
      numeroPzasTiempoFecha: pic.piecesTimeDateNumber || '',
      fechaOriginacion: formatDateForInput(pic.originationDate),
      fechaImplementacion: formatDateForInput(pic.implementationDate),
      operacionesAfectadas: pic.affectedOperations || '',
      motivoRevision: pic.revisionReason || '',
      pasosProcedimiento: pic.procedureSteps && pic.procedureSteps.length > 0
        ? pic.procedureSteps
            .sort((a, b) => a.stepOrder - b.stepOrder)
            .map(step => {
              // Ensure responsable is a string (emp_id) for the dropdown
              // Note: Prisma returns 'responsible' (English) from database
              const responsableValue = step.responsible || step.responsable || '';
              
              // The dropdown uses emp_id.toString(), so we need to ensure exact match
              let responsableId = '';
              if (responsableValue) {
                // Convert to number first, then to string to ensure format matches
                const num = typeof responsableValue === 'string' 
                  ? parseInt(responsableValue.trim(), 10)
                  : Number(responsableValue);
                // Only use if it's a valid number
                if (!isNaN(num) && num > 0) {
                  responsableId = String(num);
                } else {
                  // Fallback: use as string if it's not a number
                  responsableId = String(responsableValue).trim();
                }
              }
              
              // Log the raw data from database
              console.log('Raw DB step.responsible:', step.responsible, 'step.responsable:', step.responsable, 'Type:', typeof step.responsible);
              console.log('Transformed responsableId:', responsableId, 'Type:', typeof responsableId);
              
              return {
                paso: step.stepDescription || '',
                responsable: responsableId,
                fecha: formatDateForInput(step.date),
              };
            })
        : [{ paso: '', responsable: '', fecha: '' }],
      documentos: pic.documents && pic.documents.length > 0
        ? pic.documents.map(doc => {
            // Ensure responsable is a string (emp_id) for the dropdown
            // Note: Prisma returns 'responsible' (English) from database
            const responsableValue = doc.responsible || doc.responsable || '';
            
            // The dropdown uses emp_id.toString(), so we need to ensure exact match
            let responsableId = '';
            if (responsableValue) {
              // Convert to number first, then to string to ensure format matches
              const num = typeof responsableValue === 'string' 
                ? parseInt(responsableValue.trim(), 10)
                : Number(responsableValue);
              // Only use if it's a valid number
              if (!isNaN(num) && num > 0) {
                responsableId = String(num);
              } else {
                // Fallback: use as string if it's not a number
                responsableId = String(responsableValue).trim();
              }
            }
            
            console.log('Document responsible:', doc.responsible, 'doc.responsable:', doc.responsable, '-> transformed:', responsableId);
            
            return {
              tipo: doc.documentType || '',
              responsable: responsableId,
              fecha: formatDateForInput(doc.date),
            };
          })
        : [],
      validaciones: pic.validations && pic.validations.length > 0
        ? pic.validations.map(val => {
            // Ensure responsable is a string (emp_id) for the dropdown
            // Note: Prisma returns 'responsible' (English) from database
            const responsableValue = val.responsible || val.responsable || '';
            
            // The dropdown uses emp_id.toString(), so we need to ensure exact match
            let responsableId = '';
            if (responsableValue) {
              // Convert to number first, then to string to ensure format matches
              const num = typeof responsableValue === 'string' 
                ? parseInt(responsableValue.trim(), 10)
                : Number(responsableValue);
              // Only use if it's a valid number
              if (!isNaN(num) && num > 0) {
                responsableId = String(num);
              } else {
                // Fallback: use as string if it's not a number
                responsableId = String(responsableValue).trim();
              }
            }
            
            console.log('Validation responsible:', val.responsible, 'val.responsable:', val.responsable, '-> transformed:', responsableId);
            
            return {
              validacion: val.validationDescription || '',
              responsable: responsableId,
              fecha: formatDateForInput(val.date),
            };
          })
        : [{ validacion: '', responsable: '', fecha: '' }],
      aprobacionesRequeridas: pic.approvals && pic.approvals.length > 0
        ? pic.approvals.map(approval => {
            // Try to find employee by approverId
            const empId = parseInt(approval.approverId);
            const empleado = empleados.find(emp => emp.emp_id === empId);
            return {
              emp_id: empId,
              emp_alias: empleado?.emp_alias || approval.approverId,
            };
          })
        : [],
      disponibilidad: pic.availability
        ? {
            fixtures: pic.availability.fixtures || false,
            equipoPrueba: pic.availability.testEquipment || false,
            otros: pic.availability.other || '',
          }
        : {
            fixtures: false,
            equipoPrueba: false,
            otros: '',
          },
      motivoCambio: pic.changeReason
        ? {
            seguridad: pic.changeReason.safety || false,
            entrega: pic.changeReason.delivery || false,
            productividad: pic.changeReason.productivity || false,
            calidad: pic.changeReason.quality || false,
            costo: pic.changeReason.cost || false,
            proceso: pic.changeReason.process || false,
            otros: pic.changeReason.other || '',
          }
        : {
            seguridad: false,
            entrega: false,
            productividad: false,
            calidad: false,
            costo: false,
            proceso: false,
            otros: '',
          },
    };
  }, [empleados]);

  // React Hook Form setup
  const {
    handleSubmit: handleFormSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
    trigger,
  } = useForm({
    resolver: zodResolver(picSchemaRefined),
    defaultValues: {
      areaAfectada: '',
      plataforma: '',
      numerosParteAfectados: 'todos',
      numerosParteTexto: '',
      temporalDefinitivo: 'Temporal',
      tipoTemporal: 'Piezas',
      numeroPzasTiempoFecha: '',
      fechaOriginacion: '',
      fechaImplementacion: '',
      operacionesAfectadas: '',
      motivoRevision: '',
      pasosProcedimiento: [{ paso: '', responsable: '', fecha: '' }],
      documentos: [],
      validaciones: [{ validacion: '', responsable: '', fecha: '' }],
      aprobacionesRequeridas: [],
      disponibilidad: {
        fixtures: false,
        equipoPrueba: false,
        otros: '',
      },
      motivoCambio: {
        seguridad: false,
        entrega: false,
        productividad: false,
        calidad: false,
        costo: false,
        proceso: false,
        otros: '',
      },
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  // Populate form when PIC data is loaded (edit mode)
  useEffect(() => {
    if (isEditMode && picData && !isLoadingPicData && empleados.length > 0) {
      const formData = transformPicToForm(picData);
      if (formData) {
        console.log('Populating form with data:', formData);
        console.log('Pasos procedimiento responsables:', formData.pasosProcedimiento?.map(p => ({ paso: p.paso, responsable: p.responsable, tipo: typeof p.responsable })));
        console.log('Documentos responsables:', formData.documentos?.map(d => ({ tipo: d.tipo, responsable: d.responsable, tipoVal: typeof d.responsable })));
        console.log('Validaciones responsables:', formData.validaciones?.map(v => ({ validacion: v.validacion, responsable: v.responsable, tipoVal: typeof v.responsable })));
        reset(formData);
        setIsLoadingPic(false);
      }
    } else if (!isEditMode) {
      setIsLoadingPic(false);
    }
  }, [picData, isLoadingPicData, isEditMode, reset, empleados, transformPicToForm]);

  // Watch form values
  const formData = watch();
  const areaAfectada = watch('areaAfectada');
  const pasosProcedimiento = watch('pasosProcedimiento');
  const documentos = watch('documentos');
  const validaciones = watch('validaciones');
  const aprobacionesRequeridas = watch('aprobacionesRequeridas');
  const disponibilidad = watch('disponibilidad');
  const motivoCambio = watch('motivoCambio');
  
  // Debug: Log form values when they change
  useEffect(() => {
    if (isEditMode && pasosProcedimiento) {
      console.log('Current pasosProcedimiento form values:', pasosProcedimiento);
    }
  }, [isEditMode, pasosProcedimiento]);
  
  // Track previous area to handle changes
  const [previousAreaId, setPreviousAreaId] = useState(null);
  
  // Auto-populate mandatory approvers when area is selected
  useEffect(() => {
    if (areaAfectada && areas.length > 0) {
      const selectedArea = areas.find(area => area.id.toString() === areaAfectada || area.name === areaAfectada);
      
      if (selectedArea) {
        // If area changed, remove old mandatory approvers and add new ones
        if (previousAreaId && previousAreaId !== areaAfectada) {
          const previousArea = areas.find(area => area.id.toString() === previousAreaId || area.name === previousAreaId);
          const previousMandatoryIds = previousArea?.approvers?.map(a => a.emp_id) || [];
          
          // Remove old mandatory approvers
          const remainingApprovers = aprobacionesRequeridas.filter(
            approver => !previousMandatoryIds.includes(approver.emp_id)
          );
          
          // Add new mandatory approvers
          const newMandatoryApprovers = selectedArea.approvers || [];
          const currentApproverIds = remainingApprovers.map(a => a.emp_id);
          const mandatoryToAdd = newMandatoryApprovers.filter(
            approver => !currentApproverIds.includes(approver.emp_id)
          );
          
          setValue('aprobacionesRequeridas', [
            ...remainingApprovers,
            ...mandatoryToAdd
          ], { shouldValidate: false });
        } else if (!previousAreaId && selectedArea.approvers && selectedArea.approvers.length > 0) {
          // First time selecting an area - just add mandatory approvers
          const currentApproverIds = aprobacionesRequeridas.map(a => a.emp_id);
          const mandatoryApproversToAdd = selectedArea.approvers.filter(
            approver => !currentApproverIds.includes(approver.emp_id)
          );
          
          if (mandatoryApproversToAdd.length > 0) {
            setValue('aprobacionesRequeridas', [
              ...aprobacionesRequeridas,
              ...mandatoryApproversToAdd
            ], { shouldValidate: false });
          }
        }
        
        setPreviousAreaId(areaAfectada);
      }
    } else if (!areaAfectada && previousAreaId) {
      // Area was cleared - remove all mandatory approvers from previous area
      const previousArea = areas.find(area => area.id.toString() === previousAreaId || area.name === previousAreaId);
      const previousMandatoryIds = previousArea?.approvers?.map(a => a.emp_id) || [];
      
      const remainingApprovers = aprobacionesRequeridas.filter(
        approver => !previousMandatoryIds.includes(approver.emp_id)
      );
      
      setValue('aprobacionesRequeridas', remainingApprovers, { shouldValidate: false });
      setPreviousAreaId(null);
    }
  }, [areaAfectada, areas, aprobacionesRequeridas, setValue, previousAreaId]);

  // Map empleados to the format expected by the component
  // Each approver will have emp_id and emp_alias
  const aprobadoresDisponibles = empleados.map(emp => ({
    emp_id: emp.emp_id,
    emp_alias: emp.emp_alias,
  }));

  const documentosDisponibles = [
    'Metodo de trabajo',
    'Ayudas visuales',
    'Especificacion de producto',
    'Alertas',
    'Software',
    'Empaque del producto',
    'Flujo de trabajo',
    'FMEA del proceso',
    'Capacidad del proceso',
    'Prog/rutinas de mantenimiento',
    'Plan de control',
    'Diagrama de flujo',
    'Instruccion de trabajo',
    'Criterio de aceptacion',
    'Entrenamiento',
    'Procedimiento',
    'Sumario Tiempos de Ciclo',
    'Routing',
    'Otros'
  ];

  const steps = ['Información General', 'Pasos del Procedimiento', 'Actualización de Documentos', 'Validación', 'Aprobaciones Requeridas', 'Disponibilidad y Motivo', 'Adjuntar Archivo'];

  const handleChange = (field) => (event) => {
    setValue(field, event.target.value, { shouldValidate: false });
  };

  const handleNext = async (e) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Validate only the fields for the current step
    let fieldsToValidate = [];
    
    switch (activeStep) {
      case 0: // General Information
        fieldsToValidate = [
          'areaAfectada',
          'plataforma',
          'numerosParteAfectados',
          'numerosParteTexto',
          'temporalDefinitivo',
          'tipoTemporal',
          'numeroPzasTiempoFecha',
          'fechaOriginacion',
          'fechaImplementacion',
          'operacionesAfectadas',
          'motivoRevision',
        ];
        break;
      case 1: // Procedure Steps
        fieldsToValidate = ['pasosProcedimiento'];
        break;
      case 2: // Documents
        fieldsToValidate = ['documentos'];
        break;
      case 3: // Validations
        fieldsToValidate = ['validaciones'];
        break;
      case 4: // Approvals (required - at least one approver needed)
        fieldsToValidate = ['aprobacionesRequeridas'];
        break;
      case 5: // Availability & Change Reason
        fieldsToValidate = ['disponibilidad', 'motivoCambio'];
        break;
      case 6: // Attach File (optional, no validation needed)
        // File attachment is optional, allow to proceed to submit
        fieldsToValidate = [];
        break;
      default:
        fieldsToValidate = [];
    }
    
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleAddPaso = () => {
    setValue('pasosProcedimiento', [...pasosProcedimiento, { paso: '', responsable: '', fecha: '' }]);
  };

  const handleRemovePaso = (index) => {
    const newPasos = pasosProcedimiento.filter((_, i) => i !== index);
    setValue('pasosProcedimiento', newPasos);
  };

  const handlePasoChange = (index, field) => (event) => {
    const newPasos = [...pasosProcedimiento];
    newPasos[index][field] = event.target.value;
    setValue('pasosProcedimiento', newPasos, { shouldValidate: false });
  };

  const handleAddDocumento = (tipoDocumento) => {
    if (!documentos.find(doc => doc.tipo === tipoDocumento)) {
      setValue('documentos', [...documentos, { 
        tipo: tipoDocumento, 
        responsable: '', 
        fecha: '' 
      }]);
    }
  };

  const handleRemoveDocumento = (index) => {
    const newDocs = documentos.filter((_, i) => i !== index);
    setValue('documentos', newDocs);
  };

  const handleDocumentoChange = (index, field) => (event) => {
    const newDocs = [...documentos];
    newDocs[index][field] = event.target.value;
    setValue('documentos', newDocs, { shouldValidate: false });
  };

  const handleAddValidacion = () => {
    setValue('validaciones', [...validaciones, { validacion: '', responsable: '', fecha: '' }]);
  };

  const handleRemoveValidacion = (index) => {
    const newValidaciones = validaciones.filter((_, i) => i !== index);
    setValue('validaciones', newValidaciones);
  };

  const handleValidacionChange = (index, field) => (event) => {
    const newValidaciones = [...validaciones];
    newValidaciones[index][field] = event.target.value;
    setValue('validaciones', newValidaciones, { shouldValidate: false });
  };

  const handleAddAprobador = (empId) => {
    // empId comes as string from the dropdown, convert to number for comparison
    const empIdNum = parseInt(empId);
    // Find the approver in the available approvers list (now populated from empleados DB)
    const aprobador = aprobadoresDisponibles.find(a => a.emp_id === empIdNum);
    if (aprobador && !aprobacionesRequeridas.find(a => a.emp_id === empIdNum || (a.emp_id && parseInt(a.emp_id) === empIdNum))) {
      // Ensure emp_id is stored as a number
      const newAprobador = { ...aprobador, emp_id: empIdNum };
      setValue('aprobacionesRequeridas', [...aprobacionesRequeridas, newAprobador], { shouldValidate: false });
    }
  };

  const handleRemoveAprobador = (index) => {
    // Prevent removing mandatory approvers
    const approverToRemove = aprobacionesRequeridas[index];
    if (approverToRemove) {
      const selectedArea = areas.find(area => area.id.toString() === areaAfectada || area.name === areaAfectada);
      const mandatoryApproverIds = selectedArea?.approvers?.map(a => a.emp_id) || [];
      
      if (mandatoryApproverIds.includes(approverToRemove.emp_id)) {
        // Don't allow removal of mandatory approvers
        return;
      }
    }
    
    const newAprobaciones = aprobacionesRequeridas.filter((_, i) => i !== index);
    setValue('aprobacionesRequeridas', newAprobaciones);
  };

  const handleDisponibilidadChange = (field) => (event) => {
    setValue('disponibilidad', {
      ...disponibilidad,
      [field]: field === 'otros' ? event.target.value : event.target.checked,
    }, { shouldValidate: false });
  };

  const handleMotivoCambioChange = (field) => (event) => {
    setValue('motivoCambio', {
      ...motivoCambio,
      [field]: field === 'otros' ? event.target.value : event.target.checked,
    }, { shouldValidate: false });
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          alert('El archivo es demasiado grande. El tamaño máximo es 10MB.');
          event.target.value = '';
          return;
        }
        setArchivoAdjunto(file);
      } else {
        alert('Solo se permiten archivos PDF');
        event.target.value = '';
      }
    } else {
      // File was removed
      setArchivoAdjunto(null);
    }
  };

  const onSubmit = async (data) => {
    // Only allow submission from the last step (Adjuntar Archivo)
    if (activeStep !== steps.length - 1) {
      return; // Prevent submission
    }

    try {
      const formDataToSubmit = {
        ...data,
      };

      let finalPicId = null;
      
      if (isEditMode) {
        // Update existing PIC
        if (!picId) {
          console.error('PIC ID is required for editing');
          return;
        }
        
        const result = await updatePicMutation.mutateAsync({
          picId: parseInt(picId),
          picData: formDataToSubmit,
        });
        
        // Store the updated PIC ID
        if (result?.data?.id) {
          finalPicId = result.data.id;
          setCreatedPicId(result.data.id);
        } else if (result?.data?.data?.id) {
          finalPicId = result.data.data.id;
          setCreatedPicId(result.data.data.id);
        } else {
          finalPicId = parseInt(picId);
        }
      } else {
        // Create new PIC - use logged-in user's emp_id
        formDataToSubmit.createdBy = currentUser?.emp_id || null;
        
        if (!currentUser?.emp_id) {
          console.warn('No user logged in, PIC createdBy will be null');
        }
        
        const result = await createPicMutation.mutateAsync(formDataToSubmit);
        
        // Store the created PIC ID
        if (result?.data?.id) {
          finalPicId = result.data.id;
          setCreatedPicId(result.data.id);
        } else if (result?.data?.data?.id) {
          finalPicId = result.data.data.id;
          setCreatedPicId(result.data.data.id);
        }
      }
      
      // If file is attached, upload it after PIC is created/updated
      if (archivoAdjunto && finalPicId) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append('file', archivoAdjunto);
          uploadFormData.append('picId', finalPicId.toString());

          const uploadResponse = await fetch('/api/pics/upload', {
            method: 'POST',
            body: uploadFormData,
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            console.log('File uploaded successfully:', uploadData.filePath);
            // File path is saved in: public/uploads/pics/pic_{picId}_{timestamp}_{filename}
          } else {
            const errorData = await uploadResponse.json();
            console.error('Error uploading file:', errorData.error);
            // Don't fail the entire submission if file upload fails
          }
        } catch (error) {
          console.error('Error uploading file:', error);
          // Don't fail the entire submission if file upload fails
        }
      }
      
      setIsSubmitted(true);
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} PIC:`, error);
      // Error will be handled by the mutation's error state
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return <GeneralInformationStep formData={formData} handleChange={handleChange} errors={errors} areas={areas} />;
      case 1:
        return (
          <ProcedureStepsStep
            procedureSteps={pasosProcedimiento}
            handleAddStep={handleAddPaso}
            handleRemoveStep={handleRemovePaso}
            handleStepChange={handlePasoChange}
            errors={errors.pasosProcedimiento}
          />
        );
      case 2:
        return (
          <DocumentUpdateStep
            documents={documentos}
            availableDocuments={documentosDisponibles}
            handleAddDocument={handleAddDocumento}
            handleRemoveDocument={handleRemoveDocumento}
            handleDocumentChange={handleDocumentoChange}
            errors={errors.documentos}
          />
        );
      case 3:
        return (
          <ValidationStep
            validations={validaciones}
            handleAddValidation={handleAddValidacion}
            handleRemoveValidation={handleRemoveValidacion}
            handleValidationChange={handleValidacionChange}
            errors={errors.validaciones}
          />
        );
      case 4: {
        // Get mandatory approvers for selected area
        const selectedArea = areas.find(area => area.id.toString() === areaAfectada || area.name === areaAfectada);
        const mandatoryApproverIds = selectedArea?.approvers?.map(a => a.emp_id) || [];
        
        return (
          <RequiredApprovalsStep
            requiredApprovals={aprobacionesRequeridas}
            availableApprovers={aprobadoresDisponibles}
            handleAddApprover={handleAddAprobador}
            handleRemoveApprover={handleRemoveAprobador}
            mandatoryApproverIds={mandatoryApproverIds}
          />
        );
      }
      case 5:
        return (
          <AvailabilityChangeReasonStep
            availability={disponibilidad}
            changeReason={motivoCambio}
            handleAvailabilityChange={handleDisponibilidadChange}
            handleChangeReasonChange={handleMotivoCambioChange}
          />
        );
      case 6:
        return <AttachFileStep attachedFile={archivoAdjunto} handleFileChange={handleFileChange} />;
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box>
      <PageBanner
        title={isEditMode ? `Editar PIC #${picId}` : 'Crear Nuevo PIC'}
        subtitle=""
        icon={isEditMode ? <EditIcon sx={{ fontSize: 60 }} /> : <AddIcon sx={{ fontSize: 60 }} />}
        bgGradient="linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)"
      />

      <Card elevation={3}>
        <CardContent sx={{ p: 3 }}>
          {!isSubmitted && (
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          )}

          {isLoadingPic ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
          <Box 
            component="form" 
            onSubmit={(e) => {
              // Prevent submission if not on last step
              if (activeStep !== steps.length - 1) {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }
              return handleFormSubmit(onSubmit)(e);
            }}
            onKeyDown={(e) => {
              // Prevent Enter key from submitting form except on last step
              if (e.key === 'Enter' && activeStep !== steps.length - 1) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            {/* API Error message */}
            {currentMutation.isError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                Error al {isEditMode ? 'actualizar' : 'crear'} PIC: {currentMutation.error?.message || 'Error desconocido'}
              </Alert>
            )}

            {isSubmitted ? (
              <SuccessStep picId={createdPicId} />
            ) : (
              renderStepContent(activeStep)
            )}

            {/* Navigation buttons */}
            {!isSubmitted && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  type="button"
                  disabled={activeStep === 0 || currentMutation.isPending}
                  onClick={handleBack}
                  variant="outlined"
                >
                  Atrás
                </Button>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    type="button"
                    disabled={currentMutation.isPending}
                    onClick={() => router.push('/my-pics')}
                  >
                    Cancelar
                  </Button>
                  {activeStep === steps.length - 1 ? (
                    <Button 
                      variant="contained" 
                      type="submit"
                      disabled={currentMutation.isPending}
                      startIcon={currentMutation.isPending ? <CircularProgress size={20} /> : null}
                    >
                      {currentMutation.isPending ? 'Guardando...' : isEditMode ? 'Actualizar PIC' : 'Enviar PIC'}
                    </Button>
                  ) : (
                    <Button 
                      variant="contained"
                      type="button"
                      onClick={handleNext}
                      disabled={currentMutation.isPending}
                    >
                      Siguiente
                    </Button>
                  )}
                </Box>
              </Box>
            )}
          </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

