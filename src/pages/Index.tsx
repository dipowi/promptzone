
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Copy, Edit2, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Prompt {
  id: string;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

const PROMPTS_PER_PAGE = 10; // 2 columns x 5 rows
const PASSWORD = "300695";

const Index = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [showPasswordBanner, setShowPasswordBanner] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pendingAction, setPendingAction] = useState<{ type: string; data?: any } | null>(null);
  
  const { toast } = useToast();

  // Ultra-optimized filtered prompts with useMemo
  const filteredPrompts = useMemo(() => {
    if (!searchQuery.trim()) return prompts;
    const query = searchQuery.toLowerCase();
    return prompts.filter(prompt => 
      prompt.title.toLowerCase().includes(query) || 
      prompt.content.toLowerCase().includes(query)
    );
  }, [searchQuery, prompts]);

  // Ultra-optimized pagination calculation
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredPrompts.length / PROMPTS_PER_PAGE);
    const startIndex = (currentPage - 1) * PROMPTS_PER_PAGE;
    const currentPrompts = filteredPrompts.slice(startIndex, startIndex + PROMPTS_PER_PAGE);
    
    return { totalPages, currentPrompts };
  }, [filteredPrompts, currentPage]);

  // Optimized initial load with minimal data
  useEffect(() => {
    let mounted = true;
    
    const loadPromptsUltraFast = async () => {
      try {
        setIsLoading(true);
        
        // Ultra-optimized query - only essential fields
        const { data, error } = await supabase
          .from('prompts')
          .select('id, title, content')
          .order('created_at', { ascending: false })
          .limit(100); // Increased limit for better UX

        if (!mounted) return;

        if (error) {
          console.error('Database error:', error);
          toast({
            title: "Error",
            description: "Gagal memuat prompts.",
            variant: "destructive"
          });
          return;
        }

        setPrompts(data || []);
      } catch (error) {
        if (!mounted) return;
        console.error('Loading error:', error);
        toast({
          title: "Error",
          description: "Gagal memuat prompts.",
          variant: "destructive"
        });
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadPromptsUltraFast();
    
    return () => {
      mounted = false;
    };
  }, [toast]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadPrompts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading prompts:', error);
        toast({
          title: "Error",
          description: "Gagal memuat prompts dari database.",
          variant: "destructive"
        });
        return;
      }

      setPrompts(data || []);
    } catch (error) {
      console.error('Error loading prompts:', error);
      toast({
        title: "Error",
        description: "Gagal memuat prompts.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const checkPassword = useCallback((action: string, data?: any): boolean => {
    if (isPasswordVerified) return true;
    
    setPendingAction({ type: action, data });
    setShowPasswordBanner(true);
    return false;
  }, [isPasswordVerified]);

  const handlePasswordSubmit = useCallback(() => {
    if (passwordInput === PASSWORD) {
      setIsPasswordVerified(true);
      setShowPasswordBanner(false);
      setPasswordInput('');
      
      if (pendingAction) {
        switch (pendingAction.type) {
          case 'add':
            executeOpenModal();
            break;
          case 'edit':
            executeOpenModal(pendingAction.data);
            break;
          case 'delete':
            executeDeletePrompt(pendingAction.data.id, pendingAction.data.title);
            break;
        }
        setPendingAction(null);
      }
    } else {
      toast({
        title: "Password salah!",
        description: "Silakan coba lagi.",
        variant: "destructive"
      });
      setPasswordInput('');
    }
  }, [passwordInput, pendingAction, toast]);

  const executeOpenModal = useCallback((prompt?: Prompt) => {
    setEditingPrompt(prompt || null);
    setTitle(prompt?.title || '');
    setContent(prompt?.content || '');
    setIsModalOpen(true);
  }, []);

  const executeDeletePrompt = useCallback(async (id: string, title: string) => {
    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting prompt:', error);
        toast({
          title: "Error",
          description: "Gagal menghapus prompt.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Berhasil",
        description: "Prompt berhasil dihapus."
      });

      loadPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus prompt.",
        variant: "destructive"
      });
    }
  }, [toast, loadPrompts]);

  const openModal = useCallback((prompt?: Prompt) => {
    const action = prompt ? 'edit' : 'add';
    if (!checkPassword(action, prompt)) return;
    executeOpenModal(prompt);
  }, [checkPassword, executeOpenModal]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingPrompt(null);
    setTitle('');
    setContent('');
  }, []);

  const savePrompt = useCallback(async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Judul dan isi prompt tidak boleh kosong.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingPrompt) {
        const { error } = await supabase
          .from('prompts')
          .update({
            title: title.trim(),
            content: content.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPrompt.id);

        if (error) {
          console.error('Error updating prompt:', error);
          toast({
            title: "Error",
            description: "Gagal memperbarui prompt.",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Berhasil",
          description: "Prompt berhasil diperbarui."
        });
      } else {
        const { error } = await supabase
          .from('prompts')
          .insert({
            title: title.trim(),
            content: content.trim()
          });

        if (error) {
          console.error('Error creating prompt:', error);
          toast({
            title: "Error",
            description: "Gagal menambahkan prompt.",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Berhasil", 
          description: "Prompt berhasil ditambahkan."
        });
      }

      closeModal();
      loadPrompts();
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan prompt.",
        variant: "destructive"
      });
    }
  }, [title, content, editingPrompt, toast, closeModal, loadPrompts]);

  const deletePrompt = useCallback(async (id: string, title: string) => {
    if (!checkPassword('delete', { id, title })) return;
    executeDeletePrompt(id, title);
  }, [checkPassword, executeDeletePrompt]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Berhasil",
        description: "Prompt berhasil disalin ke clipboard."
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Gagal menyalin prompt.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const renderPagination = useCallback(() => {
    const { totalPages } = paginationData;
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 3;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    pages.push(
      <Button
        key="prev"
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
        disabled={currentPage === 1}
        className="min-w-[28px] h-7"
      >
        <ChevronLeft className="w-3 h-3" />
      </Button>
    );

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrentPage(i)}
          className="min-w-[28px] h-7 text-xs"
        >
          {i}
        </Button>
      );
    }

    // Next button
    pages.push(
      <Button
        key="next"
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
        disabled={currentPage === totalPages}
        className="min-w-[28px] h-7"
      >
        <ChevronRight className="w-3 h-3" />
      </Button>
    );

    return pages;
  }, [paginationData, currentPage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-slate-600 text-xs">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Password Banner */}
      {showPasswordBanner && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-xs shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-slate-800">Password</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPasswordBanner(false);
                  setPasswordInput('');
                  setPendingAction(null);
                }}
                className="text-slate-500 hover:text-slate-700 h-5 w-5 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-slate-600 mb-3 text-xs">
              Masukkan password untuk {pendingAction?.type === 'add' ? 'menambah' : 
                pendingAction?.type === 'edit' ? 'mengedit' : 'menghapus'} prompt:
            </p>
            <div className="space-y-3">
              <Input
                type="password"
                placeholder="Password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                className="bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500 h-7 text-xs"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordBanner(false);
                    setPasswordInput('');
                    setPendingAction(null);
                  }}
                  className="flex-1 h-7 text-xs"
                >
                  Batal
                </Button>
                <Button
                  onClick={handlePasswordSubmit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 h-7 text-xs"
                >
                  OK
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[728px] mx-auto p-3 md:p-4">
        {/* Header - Centered */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4 shadow-sm">
          <div className="text-center mb-4">
            <h1 className="text-xl md:text-2xl font-semibold text-slate-800 mb-2 text-center">
              PROMPT ZONE
            </h1>
            <p className="text-slate-600 mb-4 text-sm text-center">
              Kumpulan prompt ai by{' '}
              <a
                href="https://fb.me/didin.prasetyawan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline font-medium"
              >
                didin prasetyawan
              </a>
            </p>
            <div className="flex justify-center">
              <Button 
                onClick={() => openModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Prompt
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-sm mx-auto">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-3 h-3" />
            <Input
              type="text"
              placeholder="Cari prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500 h-8 text-sm"
            />
          </div>
        </div>

        {/* Prompts Grid - 2 Columns */}
        {paginationData.currentPrompts.length === 0 ? (
          <div className="bg-slate-50 rounded-lg p-8 text-center border border-dashed border-slate-300">
            <p className="text-slate-500 text-sm">
              {searchQuery ? 'Tidak ada prompt yang ditemukan.' : 'Belum ada prompt tersimpan.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {paginationData.currentPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="bg-slate-50 rounded-lg p-3 border border-slate-200 hover:shadow-sm transition-shadow"
                >
                  <h3 className="font-semibold text-slate-800 mb-2 text-sm leading-tight text-center">
                    {prompt.title}
                  </h3>
                  <div className="mb-3 max-h-16 overflow-y-auto">
                    <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-wrap break-words">
                      {prompt.content}
                    </p>
                  </div>
                  <div className="flex justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(prompt.content)}
                      className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 h-6 w-6 p-0"
                      title="Copy"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openModal(prompt)}
                      className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 h-6 w-6 p-0"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePrompt(prompt.id, prompt.title)}
                      className="text-slate-500 hover:text-red-600 hover:bg-red-50 h-6 w-6 p-0"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {paginationData.totalPages > 1 && (
              <div className="flex justify-center gap-1 pt-2">
                {renderPagination()}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-center">
              {editingPrompt ? 'Edit Prompt' : 'Add New Prompt'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                  Judul
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Masukkan judul prompt"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="content" className="text-sm font-medium text-slate-700">
                  Prompt
                </Label>
                <Textarea
                  id="content"
                  placeholder="Masukkan isi prompt"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="mt-1 min-h-[120px] bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500 resize-vertical"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-between gap-3 pt-3 border-t border-slate-200 bg-slate-50 -mx-6 px-6 -mb-6 pb-6 rounded-b-lg">
            <Button
              variant="outline"
              onClick={closeModal}
              className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              Batal
            </Button>
            <Button
              onClick={savePrompt}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
