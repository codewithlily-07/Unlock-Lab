import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import { Building, Cpu, Plus, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';

export function ResourceEditorPage() {
  const { id } = useParams();
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [type, setType] = useState('room'); // room | laboratory | equipment
  const [category, setCategory] = useState('testing_bay');
  const [departmentId, setDepartmentId] = useState('');
  const [campusId, setCampusId] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState(1);
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [operatingHoursStart, setOperatingHoursStart] = useState('08:00');
  const [operatingHoursEnd, setOperatingHoursEnd] = useState('20:00');
  const [minDurationMinutes, setMinDurationMinutes] = useState(30);
  const [maxDurationMinutes, setMaxDurationMinutes] = useState(240);
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [safetyGuidelines, setSafetyGuidelines] = useState('');
  const [departments, setDepartments] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCatalogs();
    if (isEditing) {
      loadResource();
    }
  }, [id]);

  async function loadCatalogs() {
    try {
      const [deptList, campusList] = await Promise.all([
        api.getDepartments(),
        api.getCampuses(),
      ]);
      setDepartments(deptList || []);
      setCampuses(campusList || []);
      if (campusList && campusList.length > 0 && !campusId) {
        setCampusId(campusList[0].id);
      }
    } catch (e) {
      console.error('Failed to load departments or campuses:', e);
    }
  }

  async function loadResource() {
    setLoading(true);
    try {
      const res = await api.getResource(id);
      if (res) {
        setName(res.name);
        setType(res.type);
        setCategory(res.category);
        setDepartmentId(res.department_id || '');
        setCampusId(res.campus_id || '');
        setLocation(res.location);
        setCapacity(res.capacity || 1);
        setTotalQuantity(res.total_quantity || 1);
        setOperatingHoursStart(res.operating_hours_start || '08:00');
        setOperatingHoursEnd(res.operating_hours_end || '20:00');
        setMinDurationMinutes(res.min_duration_minutes || 30);
        setMaxDurationMinutes(res.max_duration_minutes || 240);
        setRequiresApproval(res.requires_approval === 1 || res.requires_approval === true);
        setDescription(res.description || '');
        setPhotoUrl(res.photos?.[0] || '');
        setSafetyGuidelines(res.safety_guidelines || '');
      }
    } catch (err) {
      setError(err.message || 'Failed to load resource details');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!isAdmin) {
      setError('Only administrators can register or modify resources');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: isEditing ? id : undefined,
        name: name.trim(),
        type,
        category,
        department_id: departmentId || null,
        campus_id: campusId || null,
        location: location.trim(),
        capacity: Number(capacity) || 1,
        total_quantity: Number(totalQuantity) || 1,
        available_quantity: Number(totalQuantity) || 1,
        operating_hours_start: operatingHoursStart,
        operating_hours_end: operatingHoursEnd,
        min_duration_minutes: Number(minDurationMinutes) || 30,
        max_duration_minutes: Number(maxDurationMinutes) || 240,
        requires_approval: requiresApproval ? 1 : 0,
        description: description.trim(),
        photos: photoUrl.trim() ? [photoUrl.trim()] : [],
        safety_guidelines: safetyGuidelines.trim(),
        status: 'active',
      };

      const saved = await api.saveResource(payload);
      showToast(
        isEditing
          ? 'Resource updated successfully in database!'
          : 'New resource saved successfully to database!',
        'success'
      );
      navigate('/campuses');
    } catch (err) {
      setError(err.message || 'Failed to save resource');
      showToast(err.message || 'Error saving resource', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-[#c2413a]/30 shadow-sm space-y-3 max-w-md mx-auto my-12">
        <ShieldCheck className="w-10 h-10 text-[#c2413a] mx-auto" />
        <h2 className="text-base font-bold text-[#17231E]">Administrative Privilege Required</h2>
        <p className="text-xs text-[#4A5B53]">Only authorized administrators can enter or edit campus resources.</p>
        <Link to="/login">
          <Button size="sm" variant="primary">Sign In as Admin</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <Link
        to="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#126B4F] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Administrator Hub</span>
      </Link>

      <Card className="border-[#E5DDD0] shadow-sm">
        <CardHeader className="p-6 border-b border-[#E8E2D2]">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-[#103C2D]" />
            <h1 className="text-xl font-bold font-serif text-[#17231E]">
              {isEditing ? 'Edit Campus Facility / Equipment' : 'Register New Campus Resource'}
            </h1>
          </div>
          <p className="text-xs text-[#4A5B53] mt-1">
            Enter real facility details into the UnlockLab database. These records will be immediately available for student and faculty reservations.
          </p>
        </CardHeader>

        <CardBody className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {error && (
              <div className="p-3.5 rounded-xl bg-[#fdf2f1] border border-[#c2413a]/30 text-[#c2413a] text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <FormField label="Resource Name" required>
              <Input
                required
                placeholder="e.g. Rohde &amp; Schwarz Spectrum Analyzer or VLSI Design Lab 304"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Resource Type" required>
                <Select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    if (e.target.value === 'equipment') setCategory('instrument');
                    else setCategory('testing_bay');
                  }}
                  className="text-xs"
                >
                  <option value="room">Room / Testing Bay</option>
                  <option value="laboratory">Complete Laboratory</option>
                  <option value="equipment">Specialized Equipment / Instrument</option>
                </Select>
              </FormField>

              <FormField label="Category" required>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="text-xs"
                >
                  <option value="testing_bay">Testing Bay</option>
                  <option value="meeting_room">Meeting / Seminar Room</option>
                  <option value="maker_lab">Prototyping / Fabrication Lab</option>
                  <option value="instrument">Measurement Instrument</option>
                  <option value="computing">High Performance Computing</option>
                  <option value="microscope">Microscopy &amp; Imaging</option>
                  <option value="spectroscopy">Spectroscopy &amp; Chemical Analysis</option>
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Academic Department">
                <Select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="text-xs"
                >
                  <option value="">All Departments (Interdisciplinary)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Campus Zone">
                <Select
                  value={campusId}
                  onChange={(e) => setCampusId(e.target.value)}
                  className="text-xs"
                >
                  <option value="">Central Campus Facilities</option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            <FormField label="Exact Room / Bench Location" required>
              <Input
                required
                placeholder="e.g. Science Complex, West Wing, 3rd Floor, Room 312"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="text-xs"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Capacity (Occupants)">
                <Input
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="text-xs"
                />
              </FormField>

              <FormField label="Quantity Available">
                <Input
                  type="number"
                  min={1}
                  value={totalQuantity}
                  onChange={(e) => setTotalQuantity(e.target.value)}
                  className="text-xs"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Operating Hours Start" required>
                <Input
                  type="time"
                  value={operatingHoursStart}
                  onChange={(e) => setOperatingHoursStart(e.target.value)}
                  className="text-xs"
                />
              </FormField>

              <FormField label="Operating Hours End" required>
                <Input
                  type="time"
                  value={operatingHoursEnd}
                  onChange={(e) => setOperatingHoursEnd(e.target.value)}
                  className="text-xs"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Min Duration (Minutes)">
                <Input
                  type="number"
                  step={15}
                  min={15}
                  value={minDurationMinutes}
                  onChange={(e) => setMinDurationMinutes(e.target.value)}
                  className="text-xs"
                />
              </FormField>

              <FormField label="Max Duration (Minutes)">
                <Input
                  type="number"
                  step={15}
                  min={30}
                  value={maxDurationMinutes}
                  onChange={(e) => setMaxDurationMinutes(e.target.value)}
                  className="text-xs"
                />
              </FormField>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E8E2D2] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#17231E] block">Requires Administrative Approval</span>
                <span className="text-[11px] text-[#4A5B53] block">
                  When enabled, reservations enter the Review Queue for confirmation before a slot is reserved.
                </span>
              </div>
              <input
                type="checkbox"
                checked={requiresApproval}
                onChange={(e) => setRequiresApproval(e.target.checked)}
                className="w-4 h-4 text-[#103C2D] rounded focus:ring-[#103C2D]"
              />
            </div>

            <FormField label="Description">
              <Textarea
                placeholder="Technical specifications, capabilities, and availability conditions..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs"
              />
            </FormField>

            <FormField label="Photo URL (Optional)">
              <Input
                placeholder="https://images.unsplash.com/..."
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="text-xs"
              />
            </FormField>

            <FormField label="Safety Guidelines &amp; Operating Rules (Optional)">
              <Textarea
                placeholder="e.g. Safety goggles required. ESD wrist strap must be worn on testing bays..."
                rows={2}
                value={safetyGuidelines}
                onChange={(e) => setSafetyGuidelines(e.target.value)}
                className="text-xs"
              />
            </FormField>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full font-bold bg-[#103C2D] hover:bg-[#185340] text-white py-2.5 rounded-xl text-xs"
                loading={saving}
              >
                {isEditing ? 'Save Changes to Database' : 'Register Resource in Database'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export default ResourceEditorPage;
